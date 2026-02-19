import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { SuperAdminMailService } from './super-admin/super-admin-mail.service';

@Injectable()
export class AppService {
  constructor(
    private prisma: PrismaService,
    private mailService: SuperAdminMailService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getSystemStatus() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'maintenanceMode' },
    });
    return { maintenanceMode: setting?.value === 'true' };
  }

  async getPublicStats() {
    const activeCafes = await this.prisma.cafe.count({
      where: { status: 'APPROVED', isActive: true },
    });

    // We can assume each cafe has at least 1 menu item, or fetch real product count
    const totalProducts = await this.prisma.product.count({
      where: { isAvailable: true },
    });

    // Approximate orders (or real if needed)
    const totalOrders = await this.prisma.order.count();

    // Unique cities (from address field in Cafe)
    const cafes = await this.prisma.cafe.findMany({
      where: { status: 'APPROVED', isActive: true },
      select: { city: true },
    });

    const uniqueCities = new Set(cafes.map((c) => c.city).filter(Boolean)).size;

    return {
      activeCafes,
      totalProducts,
      totalOrders,
      uniqueCities,
    };
  }

  async sendSupportEmail(email: string, message: string) {
    return this.mailService.sendSupportEmail(email, message);
  }
}
