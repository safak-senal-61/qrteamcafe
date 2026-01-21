import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

// Service for managing reviews
@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(createReviewDto: CreateReviewDto) {
    // 1. Create Review
    const review = await this.prisma.review.create({
      data: createReviewDto,
    });

    // 2. Update Product Average Rating
    await this.updateProductRating(createReviewDto.productId);

    return review;
  }

  private async updateProductRating(productId: string) {
    const aggregate = await this.prisma.review.aggregate({
      where: { productId },
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
      where: { productId },
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
}
