import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CafesService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const cafe = await this.prisma.cafe.findUnique({
      where: { id },
    });
    if (!cafe) throw new NotFoundException('Cafe bulunamadı');
    return cafe;
  }

  async update(id: string, data: any) {
    return this.prisma.cafe.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        city: data.city,
        district: data.district,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        authorizedPerson: data.authorizedPerson,
        serviceType: data.serviceType,
        workingHours: data.workingHours,
        preparationTime: data.preparationTime ? parseInt(data.preparationTime) : undefined,
        paymentMethods: data.paymentMethods,
        logoUrl: data.logoUrl,
        googleMapsUrl: data.googleMapsUrl,
        showProductRatings: data.showProductRatings,
      },
    });
  }

  async getDashboardStats(cafeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, dailyRevenue, activeTables, totalProducts] =
      await Promise.all([
        // Total Orders
        this.prisma.order.count({ where: { cafeId } }),

        // Daily Revenue
        this.prisma.order.aggregate({
          where: {
            cafeId,
            createdAt: { gte: today },
            status: 'PAID',
          },
          _sum: { totalAmount: true },
        }),

        // Active Tables (Tables with occupied status)
        this.prisma.table.count({ where: { cafeId, isOccupied: true } }),

        // Total Products
        this.prisma.product.count({ where: { cafeId } }),
      ]);

    // Recent Orders
    const recentOrders = await this.prisma.order.findMany({
      where: { cafeId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        table: true,
        items: {
          include: { product: true },
        },
      },
    });

    // Popular Products (Mocking logic for now as aggregation is complex with Prisma sometimes)
    // Real implementation would group by order items
    const popularProducts = await this.prisma.product.findMany({
      where: { cafeId },
      take: 5,
      orderBy: {
        orderItems: {
          _count: 'desc',
        },
      },
    });

    return {
      totalOrders,
      dailyRevenue: dailyRevenue._sum.totalAmount || 0,
      activeTables,
      totalProducts,
      recentOrders,
      popularProducts,
    };
  }
}
