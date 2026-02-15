import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async logAction(
    cafeId: string,
    actionType: string,
    details: string,
    actorId: string,
    actorType: 'ADMIN' | 'WAITER' | 'SYSTEM',
    relatedId?: string,
  ) {
    return this.prisma.suspiciousActionLog.create({
      data: {
        cafeId,
        actionType,
        details,
        adminId: actorType === 'ADMIN' ? actorId : undefined,
        waiterId: actorType === 'WAITER' ? actorId : undefined,
        relatedId,
        timestamp: new Date(),
      },
    });
  }

  async getLogs(cafeId?: string, limit: number = 50, offset: number = 0) {
    const where = cafeId ? { cafeId } : {};

    const [total, logs] = await Promise.all([
      this.prisma.suspiciousActionLog.count({ where }),
      this.prisma.suspiciousActionLog.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { timestamp: 'desc' },
        include: {
          admin: {
            select: {
              name: true,
              email: true,
            },
          },
          waiter: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      data: logs,
    };
  }
}
