import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCafeDto } from './dto/update-cafe.dto';

@Injectable()
export class CafesService {
  constructor(private prisma: PrismaService) {}

  async findOne(idOrSlug: string) {
    // Check if it's a valid UUID
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    let cafe;
    if (isUuid) {
      cafe = await this.prisma.cafe.findUnique({
        where: { id: idOrSlug },
      });
    } else {
      cafe = await this.prisma.cafe.findUnique({
        where: { slug: idOrSlug },
      });
    }

    if (!cafe) throw new NotFoundException('Cafe bulunamadı');
    return cafe;
  }

  async findBySlug(slug: string) {
    const cafe = await this.prisma.cafe.findUnique({
      where: { slug },
    });
    if (!cafe) throw new NotFoundException('Cafe bulunamadı');
    return cafe;
  }

  async update(id: string, data: UpdateCafeDto) {
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
        preparationTime: data.preparationTime
          ? Number(data.preparationTime)
          : undefined,
        paymentMethods: data.paymentMethods,
        logoUrl: data.logoUrl,
        googleMapsUrl: data.googleMapsUrl,
        showProductRatings: data.showProductRatings,
        // New Settings
        coverImageUrl: data.coverImageUrl, // Schema synced
        brandColor: data.brandColor,
        menuViewMode: data.menuViewMode,
        welcomeMessage: data.welcomeMessage,
        instagramUrl: data.instagramUrl,
        facebookUrl: data.facebookUrl,
        twitterUrl: data.twitterUrl,
        wifiSsid: data.wifiSsid,
        wifiPassword: data.wifiPassword,
        waiterCallOptions: data.waiterCallOptions,
        isMaintenanceMode: data.isMaintenanceMode,
        autoApproveReviews: data.autoApproveReviews,
        isSoundEnabled: data.isSoundEnabled,
        templateId: data.templateId,
        themeConfig: data.themeConfig,
      },
    });
  }

  async getDashboardStats(cafeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cafeSettings = await this.prisma.cafe.findUnique({
      where: { id: cafeId },
      select: { 
        isSoundEnabled: true,
        plan: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
        isSubscriptionActive: true
      },
    });

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

    // Popular Products - Real implementation using groupBy on OrderItems
    const topSellingItems = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          cafeId,
          status: { not: 'CANCELLED' }, // Exclude cancelled orders
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const productIds = topSellingItems.map((item) => item.productId);

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
      },
    });

    const popularProducts = topSellingItems
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        return {
          ...product,
          _count: {
            orderItems: item._sum.quantity || 0,
          },
        };
      })
      .filter(Boolean);

    return {
      totalOrders,
      dailyRevenue: dailyRevenue._sum.totalAmount || 0,
      activeTables,
      totalProducts,
      recentOrders,
      popularProducts,
      isSoundEnabled: cafeSettings?.isSoundEnabled ?? true,
      subscription: {
        plan: cafeSettings?.plan,
        subscriptionEndsAt: cafeSettings?.subscriptionEndsAt,
        trialEndsAt: cafeSettings?.trialEndsAt,
        isSubscriptionActive: cafeSettings?.isSubscriptionActive
      }
    };
  }
}
