import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  async getHistory(customerId: string) {
    return this.prisma.loyaltyTransaction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRewards(cafeId: string) {
    return this.prisma.reward.findMany({
      where: { cafeId, isActive: true },
      orderBy: { pointsCost: 'asc' },
    });
  }

  async redeemReward(customerId: string, rewardId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) throw new NotFoundException('Kullanıcı bulunamadı');

    const reward = await this.prisma.reward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) throw new NotFoundException('Ödül bulunamadı');
    if (!reward.isActive) throw new BadRequestException('Bu ödül şu anda aktif değil');

    if (customer.loyaltyPoints < reward.pointsCost) {
      throw new BadRequestException('Yetersiz puan');
    }

    // Transactional update
    return this.prisma.$transaction(async (tx) => {
      // Deduct points
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: { loyaltyPoints: { decrement: reward.pointsCost } },
      });

      // Generate a short code (e.g., A7X2P9)
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create transaction record
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          customerId,
          amount: -reward.pointsCost,
          type: 'SPENT_REWARD',
          description: `${reward.title} ödülü alındı. Kod: ${code}`,
        },
      });

      return {
        customer: updatedCustomer,
        transaction,
        code, // Return the code to the client
        message: 'Ödül başarıyla alındı',
      };
    });
  }

  async getRewardsForAdmin(cafeId: string) {
    return this.prisma.reward.findMany({
      where: { cafeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReward(data: { cafeId: string; title: string; description?: string; pointsCost: number; imageUrl?: string }) {
    return this.prisma.reward.create({
      data: {
        ...data,
        isActive: true,
      },
    });
  }

  async deleteReward(id: string) {
    return this.prisma.reward.delete({
      where: { id },
    });
  }
}
