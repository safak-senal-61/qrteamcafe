import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { getProductImage } from '../products/product-images.util';
import { MailService } from '../auth/mail.service';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService
  ) {}

  create(createCustomerDto: CreateCustomerDto) {
    return 'This action adds a new customer';
  }

  findAll() {
    return this.prisma.customer.findMany();
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) return null;

    if (!customer.referralCode) {
      let referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      try {
        const updated = await this.prisma.customer.update({
          where: { id },
          data: { referralCode },
        });
        // Return safe object
        const { passwordHash, verificationCode, verificationCodeExpires, ...safeCustomer } = updated;
        return safeCustomer;
      } catch (error) {
        referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const updated = await this.prisma.customer.update({
          where: { id },
          data: { referralCode },
        });
        const { passwordHash, verificationCode, verificationCodeExpires, ...safeCustomer } = updated;
        return safeCustomer;
      }
    }

    // Return safe object
    const { passwordHash, verificationCode, verificationCodeExpires, ...safeCustomer } = customer;
    return safeCustomer;
  }

  async getStats(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      select: { loyaltyPoints: true },
    });

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
    const productCounts: Record<string, { count: number; orderCount: number; name: string; image: string }> = {};
    const categoryCounts: Record<string, { count: number; name: string }> = {};

    orders.forEach((order) => {
      const productsInOrder = new Set<string>();

      order.items.forEach((item) => {
        // Product Stats
        if (!productCounts[item.productId]) {
          productCounts[item.productId] = { 
            count: 0, 
            orderCount: 0,
            name: item.product.name, 
            image: getProductImage(item.product.name, item.product.category?.name, item.product.imageUrl)
          };
        }
        productCounts[item.productId].count += item.quantity;

        if (!productsInOrder.has(item.productId)) {
          productCounts[item.productId].orderCount += 1;
          productsInOrder.add(item.productId);
        }

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

    // "2 siparişten sonra" -> orderCount > 2 (En az 3 farklı siparişte geçmeli)
    const favoriteProduct = Object.values(productCounts)
      .filter(p => p.orderCount > 2)
      .sort((a, b) => b.count - a.count)[0] || null;
    const favoriteCategory = Object.values(categoryCounts).sort((a, b) => b.count - a.count)[0] || null;

    return {
      totalOrders,
      totalSpent,
      loyaltyPoints: customer?.loyaltyPoints || 0,
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
    const { email, ...otherData } = data;
    
    // Handle Password
    if (otherData.password) {
      const salt = await bcrypt.genSalt(10);
      otherData.passwordHash = await bcrypt.hash(otherData.password, salt);
      delete otherData.password;
    }

    // Handle Email Change
    let emailVerificationRequired = false;
    if (email) {
      const currentCustomer = await this.prisma.customer.findUnique({ where: { id } });
      
      if (currentCustomer && currentCustomer.email !== email) {
        // Check if new email is taken
        const existing = await this.prisma.customer.findUnique({ where: { email } });
        if (existing) {
          throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');
        }

        // Generate code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        // Save temp email and code
        otherData.tempEmail = email;
        otherData.verificationCode = verificationCode;
        otherData.verificationCodeExpires = verificationCodeExpires;
        
        emailVerificationRequired = true;
        
        // Send email
        await this.mailService.sendEmailChangeVerificationEmail(email, verificationCode);
      }
    }

    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
      data: otherData,
    });

    return {
      ...updatedCustomer,
      emailVerificationRequired,
    };
  }

  async verifyEmailChange(id: string, code: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer || !customer.tempEmail) {
      throw new BadRequestException('Bekleyen bir e-posta değişikliği bulunamadı.');
    }

    if (customer.verificationCode !== code || !customer.verificationCodeExpires || new Date() > customer.verificationCodeExpires) {
      throw new BadRequestException('Geçersiz veya süresi dolmuş kod.');
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        email: customer.tempEmail,
        tempEmail: null,
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });
  }

  remove(id: string) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
