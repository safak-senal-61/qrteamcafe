import { Injectable, BadRequestException } from '@nestjs/common';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { getProductImage } from '../products/product-images.util';
import { MailService } from '../auth/mail.service';
import { Prisma, Product, Category } from '@prisma/client';

import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    // Basic implementation - adjust based on requirements (hashing password etc if needed)
    // Usually registration goes through AuthService, but if direct creation is needed:
    const { password, ...rest } = createCustomerDto;

    // Explicitly type data as Prisma.CustomerCreateInput (or a partial of it that includes passwordHash)
    // Note: Prisma.CustomerCreateInput requires certain fields. Using a spread object requires care.
    // For safety, we treat it as a record first, then assign passwordHash.
    const data: Prisma.CustomerCreateInput = {
      ...rest,
      // Provide defaults or handle optional fields if needed.
      // Assuming 'rest' matches the input shape except for passwordHash.
    } as Prisma.CustomerCreateInput;

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    return this.prisma.customer.create({
      data,
    });
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
      let referralCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      try {
        const updated = await this.prisma.customer.update({
          where: { id },
          data: { referralCode },
        });
        // Return safe object

        const {
          passwordHash: _ph,
          verificationCode: _vc,
          verificationCodeExpires: _vce,
          ...safeCustomer
        } = updated;

        return safeCustomer;
      } catch {
        referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const updated = await this.prisma.customer.update({
          where: { id },
          data: { referralCode },
        });

        const {
          passwordHash: _ph,
          verificationCode: _vc,
          verificationCodeExpires: _vce,
          ...safeCustomer
        } = updated;

        return safeCustomer;
      }
    }

    // Return safe object

    const {
      passwordHash: _ph,
      verificationCode: _vc,
      verificationCodeExpires: _vce,
      ...safeCustomer
    } = customer;

    return safeCustomer;
  }

  async getStats(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      select: { loyaltyPoints: true },
    });

    const orders = await this.prisma.order.findMany({
      where: {
        customerId: id,
        status: { in: ['COMPLETED', 'DELIVERED', 'PAID'] },
      },
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
    const totalSpent = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    // Calculate favorites
    const productCounts: Record<
      string,
      { count: number; orderCount: number; name: string; image: string }
    > = {};
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
            image: getProductImage(
              item.product.name,
              item.product.category?.name,
              item.product.imageUrl,
            ),
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
            name: item.product.category.name,
          };
        }
        categoryCounts[catId].count += item.quantity;
      });
    });

    // "2 siparişten sonra" -> orderCount > 2 (En az 3 farklı siparişte geçmeli)
    const favoriteProduct =
      Object.values(productCounts)
        .filter((p) => p.orderCount > 2)
        .sort((a, b) => b.count - a.count)[0] || null;
    const favoriteCategory =
      Object.values(categoryCounts).sort((a, b) => b.count - a.count)[0] ||
      null;

    return {
      totalOrders,
      totalSpent,
      loyaltyPoints: customer?.loyaltyPoints || 0,
      favoriteProduct,
      favoriteCategory,
    };
  }

  async getRecommendations(id: string, cafeId?: string) {
    // Base filter for products (always filter by available and cafeId if provided)
    const baseFilter: Prisma.ProductWhereInput = { isAvailable: true };
    if (cafeId) {
      baseFilter.cafeId = cafeId;
    }

    // 1. Check for Manual Recommendations (Chef Recommended) - PRIORITY
    // This allows admins to override automatic recommendations
    const manualRecommendations = await this.prisma.product.findMany({
      where: {
        ...baseFilter,
        isChefRecommended: true,
      },
      take: 5,
      include: { category: true },
    });

    if (manualRecommendations.length > 0) {
      return manualRecommendations.map((product) => ({
        ...product,
        imageUrl: getProductImage(
          product.name,
          product.category?.name,
          product.imageUrl,
        ),
      }));
    }

    // 2. Fallback: Automatic Recommendations
    const stats = await this.getStats(id);
    const favoriteCategoryName = stats.favoriteCategory?.name;

    type ProductWithCategory = Product & { category: Category | null };
    let recommendations: ProductWithCategory[] = [];

    if (favoriteCategoryName) {
      // Get top rated products in favorite category
      recommendations = await this.prisma.product.findMany({
        where: {
          ...baseFilter,
          category: { name: favoriteCategoryName },
        },
        orderBy: { averageRating: 'desc' },
        take: 5,
        include: { category: true },
      });
    }

    // If no favorite category or empty results, get top rated generally
    if (recommendations.length === 0) {
      recommendations = await this.prisma.product.findMany({
        where: {
          ...baseFilter,
          averageRating: { gte: 4.0 },
        },
        orderBy: { averageRating: 'desc' },
        take: 5,
        include: { category: true },
      });
    }

    // If still no recommendations, get random popular ones from the cafe
    if (recommendations.length === 0) {
      recommendations = await this.prisma.product.findMany({
        where: baseFilter,
        orderBy: { reviewCount: 'desc' },
        take: 5,
        include: { category: true },
      });
    }

    return recommendations.map((product) => ({
      ...product,
      imageUrl: getProductImage(
        product.name,
        product.category?.name,
        product.imageUrl,
      ),
    }));
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const { email, password, ...rest } = updateCustomerDto;
    const updateData: Prisma.CustomerUpdateInput = { ...rest };

    // Handle Password
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    // Handle Email Change
    let emailVerificationRequired = false;
    if (email) {
      const currentCustomer = await this.prisma.customer.findUnique({
        where: { id },
      });

      if (currentCustomer && currentCustomer.email !== email) {
        // Check if new email is taken
        const existing = await this.prisma.customer.findUnique({
          where: { email },
        });
        if (existing) {
          throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');
        }

        // Generate code
        const verificationCode = Math.floor(
          100000 + Math.random() * 900000,
        ).toString();
        const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        // Save temp email and code
        updateData.tempEmail = email;
        updateData.verificationCode = verificationCode;
        updateData.verificationCodeExpires = verificationCodeExpires;

        emailVerificationRequired = true;

        // Send email
        await this.mailService.sendEmailChangeVerificationEmail(
          email,
          verificationCode,
        );
      }
    }

    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return {
      ...updatedCustomer,
      emailVerificationRequired,
    };
  }

  async verifyEmailChange(id: string, code: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer || !customer.tempEmail) {
      throw new BadRequestException(
        'Bekleyen bir e-posta değişikliği bulunamadı.',
      );
    }

    if (
      customer.verificationCode !== code ||
      !customer.verificationCodeExpires ||
      new Date() > customer.verificationCodeExpires
    ) {
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
