import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(cafeId: string, createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        cafeId,
      },
    });
  }

  async findAll(cafeId: string) {
    return this.prisma.product.findMany({
      where: { cafeId },
      include: {
        category: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async reorder(items: { id: string; sortOrder: number }[]) {
    // Toplu güncelleme işlemi
    return this.prisma.$transaction(
      items.map((item) =>
        this.prisma.product.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Ürün bulunamadı');
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async updateStock(id: string, quantity: number) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        stock: {
          increment: quantity
        }
      }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({
      where: { id },
    });
  }

  async getRecommendations(productId: string, limit = 3) {
    // 1. Find orders that contain this product
    const ordersWithProduct = await this.prisma.orderItem.findMany({
      where: { productId },
      select: { orderId: true },
      distinct: ['orderId'],
      take: 50 // Analyze last 50 orders for performance
    });
    
    const orderIds = ordersWithProduct.map(o => o.orderId);
    if (orderIds.length === 0) return [];

    // 2. Find other items in these orders
    const relatedItems = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        orderId: { in: orderIds },
        productId: { not: productId }
      },
      _count: {
        productId: true
      },
      orderBy: {
        _count: {
          productId: 'desc'
        }
      },
      take: limit
    });

    // 3. Get product details
    const recommendedProductIds = relatedItems.map(item => item.productId);
    return this.prisma.product.findMany({
      where: { id: { in: recommendedProductIds }, isAvailable: true }
    });
  }

  async toggleChefRecommendation(id: string, isChefRecommended: boolean) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { isChefRecommended }
    });
  }
}
