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

@Injectable()
export class TablesService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(cafeId: string, createTableDto: CreateTableDto) {
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

    return this.prisma.table.create({
      data: {
        ...createTableDto,
        cafeId,
      },
    });
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

  async remove(id: string) {
    return this.prisma.table.delete({
      where: { id },
    });
  }

  async moveTable(cafeId: string, fromTableId: string, toTableId: string) {
    return this.prisma.$transaction(async (prisma) => {
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

      return { message: 'Masa başarıyla taşındı' };
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
        } catch (error) {
          console.error(`Error auto-closing table ${table.id}:`, error);
        }
      }
    }
  }
}
