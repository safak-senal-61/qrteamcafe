import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    title: string;
    content: string;
    type?: string;
    targetRole?: string;
    expiresAt?: Date;
  }) {
    return this.prisma.announcement.create({
      data,
    });
  }

  async findAllActive(role: 'CAFE_ADMIN' | 'WAITER' | 'SUPER_ADMIN') {
    const now = new Date();
    return this.prisma.announcement.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [{ targetRole: 'ALL' }, { targetRole: role }],
          },
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string) {
    return this.prisma.announcement.delete({
      where: { id },
    });
  }
}
