import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Kullanıcı girişi yapılmamış.');
    }

    // Super Admin bypass
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    if (user.role !== 'CAFE_ADMIN' || !user.cafeId) {
      // If not cafe admin (e.g. customer), maybe allow or deny?
      // Assuming this guard is only for Cafe Admin routes.
      return true; 
    }

    const cafe = await this.prisma.cafe.findUnique({
      where: { id: user.cafeId },
      select: {
        trialEndsAt: true,
        subscriptionEndsAt: true,
        isSubscriptionActive: true,
      },
    });

    if (!cafe) {
      throw new UnauthorizedException('Kafe bulunamadı.');
    }

    const now = new Date();

    // Check trial
    if (cafe.trialEndsAt && cafe.trialEndsAt > now) {
      return true;
    }

    // Check subscription
    // Allow access if subscription is active OR if the paid period hasn't ended yet
    if ((cafe.isSubscriptionActive || (cafe.subscriptionEndsAt && cafe.subscriptionEndsAt > now))) {
      return true;
    }

    throw new ForbiddenException({
      message: 'Deneme süreniz veya aboneliğiniz sona ermiş.',
      code: 'SUBSCRIPTION_EXPIRED',
    });
  }
}
