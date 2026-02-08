import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCafeDto } from './dto/update-cafe.dto';

@Injectable()
export class CafesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async findOne(idOrSlug: string) {
    // Check if it's a valid UUID
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    const cacheKey = isUuid ? `cafe:id:${idOrSlug}` : `cafe:slug:${idOrSlug}`;
    const cachedCafe = await this.cache.get(cacheKey);
    if (cachedCafe) return cachedCafe;

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
    await this.cache.set(cacheKey, cafe, 300);
    return cafe;
  }

  async findBySlug(slug: string) {
    const cacheKey = `cafe:slug:${slug}`;
    const cachedCafe = await this.cache.get(cacheKey);
    if (cachedCafe) return cachedCafe;

    const cafe = await this.prisma.cafe.findUnique({
      where: { slug },
    });
    if (!cafe) throw new NotFoundException('Cafe bulunamadı');
    await this.cache.set(cacheKey, cafe, 300);
    return cafe;
  }

  async update(id: string, data: UpdateCafeDto) {
    const updatedCafe = await this.prisma.cafe.update({
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

    await Promise.all([
      this.cache.del(`cafe:id:${id}`),
      updatedCafe.slug ? this.cache.del(`cafe:slug:${updatedCafe.slug}`) : null,
    ]);

    return updatedCafe;
  }

  async getDashboardStats(cafeId: string) {
    const cacheKey = `dashboardStats:${cafeId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cafeSettings = await this.prisma.cafe.findUnique({
      where: { id: cafeId },
      select: {
        isSoundEnabled: true,
        plan: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
        isSubscriptionActive: true,
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

    const result = {
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
        isSubscriptionActive: cafeSettings?.isSubscriptionActive,
      },
    };

    await this.cache.set(cacheKey, result, 10);
    return result;
  }
}
