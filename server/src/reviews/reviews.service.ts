import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

// Service for managing reviews
@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(createReviewDto: CreateReviewDto) {
    // Check order delivery time if orderId is present
    if (createReviewDto.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: createReviewDto.orderId }
      });

      if (order) {
        // If deliveredAt is set, check 5 minutes rule
        if (order.deliveredAt) {
          const diff = new Date().getTime() - new Date(order.deliveredAt).getTime();
          const fiveMinutesInMs = 5 * 60 * 1000;
          
          if (diff < fiveMinutesInMs) {
            const remainingMinutes = Math.ceil((fiveMinutesInMs - diff) / 60000);
            throw new BadRequestException(`Yorum yapmak için sipariş tesliminden sonra 5 dakika geçmesi gerekmektedir. Lütfen ${remainingMinutes} dakika sonra tekrar deneyiniz.`);
          }
        } 
        // If not delivered yet (and not one of the final states), block review
        else if (!['DELIVERED', 'COMPLETED', 'PAID'].includes(order.status)) {
           throw new BadRequestException('Sipariş teslim edilmeden yorum yapılamaz.');
        }
      }
    }

    // Get product to find cafeId and check autoApproveReviews setting
    const product = await this.prisma.product.findUnique({
      where: { id: createReviewDto.productId },
      include: { cafe: true }
    });

    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    const isVisible = product.cafe.autoApproveReviews;

    // 1. Create Review
    const review = await this.prisma.review.create({
      data: {
        ...createReviewDto,
        cafeId: product.cafe.id,
        isVisible,
      },
    });

    // 2. Update Product Average Rating (only if visible? No, usually average includes all, or maybe only visible ones?)
    // If not visible, it shouldn't affect the rating shown to customers yet.
    if (isVisible) {
      await this.updateProductRating(createReviewDto.productId);
    }

    return review;
  }

  private async updateProductRating(productId: string | null) {
    if (!productId) return;

    const aggregate = await this.prisma.review.aggregate({
      where: { 
        productId,
        isVisible: true // Only count visible reviews
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: aggregate._avg.rating || 0,
        reviewCount: aggregate._count.rating || 0,
      },
    });
  } 
  
  async findAllByProduct(productId: string) { 
    return this.prisma.review.findMany({ 
      where: { 
        productId, 
        isVisible: true 
      }, 
      orderBy: { createdAt: 'desc' }, 
      take: 20 
    }); 
  } 

  async findAll() { 
    return this.prisma.review.findMany({ 
      include: { 
        product: { 
          select: { name: true, imageUrl: true } 
        } 
      }, 
      orderBy: { createdAt: 'desc' } 
    }); 
  } 

  async updateAdminScore(id: string, score: number) { 
    return this.prisma.review.update({ 
      where: { id }, 
      data: { adminScore: score } 
    }); 
  } 

  async updateAdminReply(id: string, reply: string) { 
    return this.prisma.review.update({ 
      where: { id }, 
      data: { adminReply: reply } 
    }); 
  } 

  async toggleVisibility(id: string, isVisible: boolean) {
    const review = await this.prisma.review.update({
      where: { id },
      data: { isVisible }
    });

    if (review.productId) {
      await this.updateProductRating(review.productId);
    }

    return review;
  } 
}