import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { EventsGateway } from '../events/events.gateway';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class TablesService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(
    cafeId: string,
    createTableDto: CreateTableDto,
    actorId?: string,
    actorType: 'ADMIN' | 'WAITER' = 'ADMIN',
  ) {
    const existingTable = await this.prisma.table.findUnique({
      where: {
        cafeId_tableNumber: {
          cafeId,
          tableNumber: createTableDto.tableNumber,
        },
      },
    });

    if (existingTable) {
      throw new ConflictException('Bu masa numarası zaten mevcut.');
    }

    const table = await this.prisma.table.create({
      data: {
        ...createTableDto,
        cafeId,
      },
    });

    if (actorId) {
      await this.auditLogsService.logAction(
        cafeId,
        'TABLE_CREATE',
        `Table created: ${table.tableNumber}`,
        actorId,
        actorType,
        table.id,
      );
    }

    return table;
  }

  async findAll(cafeId: string) {
    return this.prisma.table.findMany({
      where: { cafeId },
      orderBy: { tableNumber: 'asc' },
      include: {
        waiterCalls: {
          where: { status: 'PENDING' },
        },
      },
    });
  }

  async remove(
    id: string,
    actorId?: string,
    actorType: 'ADMIN' | 'WAITER' = 'ADMIN',
  ) {
    const table = await this.prisma.table.findUnique({ where: { id } });
    if (!table) return null; // Or throw not found

    const deleted = await this.prisma.table.delete({
      where: { id },
    });

    if (actorId) {
      await this.auditLogsService.logAction(
        table.cafeId,
        'TABLE_DELETE',
        `Table deleted: ${table.tableNumber}`,
        actorId,
        actorType,
        table.id,
      );
    }

    return deleted;
  }

  async moveTable(
    cafeId: string,
    fromTableId: string,
    toTableId: string,
    actorId?: string,
    actorType: 'ADMIN' | 'WAITER' = 'ADMIN',
  ) {
    return this.prisma
      .$transaction(async (prisma) => {
        // 1. Kaynak masada açık sipariş var mı kontrol et
        const sourceOrders = await prisma.order.findMany({
          where: {
            tableId: fromTableId,
            status: { not: 'PAID' },
          },
        });

        if (sourceOrders.length === 0) {
          throw new BadRequestException('Taşınacak aktif sipariş bulunamadı.');
        }

        // 2. Hedef masayı kontrol et
        const targetTable = await prisma.table.findUnique({
          where: { id: toTableId },
        });

        if (!targetTable) {
          throw new NotFoundException('Hedef masa bulunamadı.');
        }

        const fromTable = await prisma.table.findUnique({
          where: { id: fromTableId },
        });

        // 3. Siparişlerin masa ID'sini güncelle
        await prisma.order.updateMany({
          where: {
            tableId: fromTableId,
            status: { not: 'PAID' },
          },
          data: {
            tableId: toTableId,
          },
        });

        // 4. Masa doluluk durumlarını güncelle
        await prisma.table.update({
          where: { id: fromTableId },
          data: { isOccupied: false },
        });

        await prisma.table.update({
          where: { id: toTableId },
          data: { isOccupied: true, lastOccupiedAt: new Date() },
        });

        // Notify clients about the move
        this.eventsGateway.notifyTableMove(
          cafeId,
          fromTableId,
          toTableId,
          targetTable.tableNumber,
        );

        if (actorId) {
          // We need to wait for transaction or use afterCommit if possible, but here we can just log after transaction or inside.
          // Audit log is separate model, fine to be in transaction or out.
          // Using `this.auditLogsService` inside might use the main prisma client, not the transaction client.
          // Since logging is not critical to the transaction success (usually), we can do it outside or ignore transaction context for logging.
          // Or better, move logging after transaction block.
        }

        return {
          message: 'Masa başarıyla taşındı',
          fromTableNumber: fromTable?.tableNumber,
          toTableNumber: targetTable.tableNumber,
        };
      })
      .then(async (result) => {
        if (actorId) {
          await this.auditLogsService.logAction(
            cafeId,
            'TABLE_MOVE',
            `Table moved: ${result.fromTableNumber} -> ${result.toTableNumber}`,
            actorId,
            actorType,
            toTableId,
          );
        }
        return result;
      });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleTableAutoClose() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const expiredTables = await this.prisma.table.findMany({
      where: {
        isOccupied: true,
        lastOccupiedAt: {
          lt: twentyFourHoursAgo,
        },
      },
    });

    if (expiredTables.length > 0) {
      console.log(
        `Found ${expiredTables.length} expired tables. Auto-closing...`,
      );

      for (const table of expiredTables) {
        try {
          await this.prisma.$transaction([
            // Mark open orders as CANCELLED
            this.prisma.order.updateMany({
              where: {
                tableId: table.id,
                status: { not: 'PAID' },
              },
              data: {
                status: 'CANCELLED',
                note: 'Sistem tarafından otomatik kapatıldı (24 saat aşımı)',
              },
            }),
            // Free the table
            this.prisma.table.update({
              where: { id: table.id },
              data: {
                isOccupied: false,
                lastOccupiedAt: null,
              },
            }),
          ]);

          // Notify via socket if needed (optional)
          this.eventsGateway.server.to(table.cafeId).emit('tableUpdate', {
            tableId: table.id,
            isOccupied: false,
          });

          // Log system action
          await this.auditLogsService.logAction(
            table.cafeId,
            'TABLE_AUTO_CLOSE',
            `Table auto-closed due to timeout: ${table.tableNumber}`,
            'SYSTEM', // actorId
            'SYSTEM', // actorType
            table.id,
          );
        } catch (error) {
          console.error(`Error auto-closing table ${table.id}:`, error);
        }
      }
    }
  }
}
