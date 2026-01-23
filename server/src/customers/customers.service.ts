import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { getProductImage } from '../products/product-images.util';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  create(createCustomerDto: CreateCustomerDto) {
    return 'This action adds a new customer';
  }

  findAll() {
    return this.prisma.customer.findMany();
  }

  findOne(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
    });
  }

  async getStats(id: string) {
    const orders = await this.prisma.order.findMany({
      where: { customerId: id, status: { in: ['COMPLETED', 'DELIVERED', 'PAID'] } },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    // Calculate favorites
    const productCounts: Record<string, { count: number; name: string; image: string }> = {};
    const categoryCounts: Record<string, { count: number; name: string }> = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        // Product Stats
        if (!productCounts[item.productId]) {
          productCounts[item.productId] = { 
            count: 0, 
            name: item.product.name, 
            image: getProductImage(item.product.name, item.product.category?.name, item.product.imageUrl)
          };
        }
        productCounts[item.productId].count += item.quantity;

        // Category Stats
        const catId = item.product.categoryId;
        if (!categoryCounts[catId]) {
          categoryCounts[catId] = { 
            count: 0, 
            name: item.product.category.name 
          };
        }
        categoryCounts[catId].count += item.quantity;
      });
    });

    const favoriteProduct = Object.values(productCounts).sort((a, b) => b.count - a.count)[0] || null;
    const favoriteCategory = Object.values(categoryCounts).sort((a, b) => b.count - a.count)[0] || null;

    return {
      totalOrders,
      totalSpent,
      favoriteProduct,
      favoriteCategory,
    };
  }

  async getRecommendations(id: string, cafeId?: string) {
    // 1. Determine favorite category
    const stats = await this.getStats(id);
    const favoriteCategoryName = stats.favoriteCategory?.name;

    let recommendations;

    // Base filter for products (always filter by available and cafeId if provided)
    const baseFilter: any = { isAvailable: true };
    if (cafeId) {
      baseFilter.cafeId = cafeId;
    }

    if (favoriteCategoryName) {
      // Get top rated products in favorite category
      recommendations = await this.prisma.product.findMany({
        where: { 
          ...baseFilter,
          category: { name: favoriteCategoryName },
        },
        orderBy: { averageRating: 'desc' },
        take: 5,
        include: { category: true }
      });
    } else {
      // If no favorite category, get top rated products from current cafe or generally
      recommendations = await this.prisma.product.findMany({
        where: { 
          ...baseFilter,
          OR: [
            { isChefRecommended: true },
            { averageRating: { gte: 4.0 } }
          ]
        },
        orderBy: { averageRating: 'desc' },
        take: 5,
        include: { category: true }
      });
    }

    // If still no recommendations (e.g. no favorites, no chef recommended), get random popular ones from the cafe
    if (recommendations.length === 0) {
       recommendations = await this.prisma.product.findMany({
        where: baseFilter,
        orderBy: { reviewCount: 'desc' },
        take: 5,
        include: { category: true }
      });
    }
    
    return recommendations.map(product => ({
      ...product,
      imageUrl: getProductImage(product.name, product.category?.name, product.imageUrl)
    }));
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const data: any = { ...updateCustomerDto };
    
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.passwordHash = await bcrypt.hash(data.password, salt);
      delete data.password;
    }

    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
