import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterSuperAdminDto } from './dto/register-super-admin.dto';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SuperAdminService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterSuperAdminDto) {
    const registerKey = this.configService.get<string>(
      'SUPER_ADMIN_REGISTER_KEY',
    );

    if (dto.registerKey !== registerKey) {
      throw new UnauthorizedException('Geçersiz kayıt anahtarı.');
    }

    const existingSuperAdmin = await this.prisma.superAdmin.findUnique({
      where: { email: dto.email },
    });

    const existingCafeAdmin = await this.prisma.cafeAdmin.findUnique({
      where: { email: dto.email },
    });

    const existingCustomer = await this.prisma.customer.findUnique({
      where: { email: dto.email },
    });

    if (existingSuperAdmin || existingCafeAdmin || existingCustomer) {
      throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    await this.prisma.superAdmin.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
      },
    });

    return { message: 'Süper admin kaydı başarıyla oluşturuldu.' };
  }

  async getPendingCafes() {
    return this.prisma.cafe.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        admins: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAllCafes() {
    return this.prisma.cafe.findMany({
      include: {
        admins: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getDashboardStats() {
    const totalCafes = await this.prisma.cafe.count();
    const pendingCafes = await this.prisma.cafe.count({
      where: { status: 'PENDING' },
    });
    const activeCafes = await this.prisma.cafe.count({
      where: { status: 'APPROVED', isActive: true },
    });
    const rejectedCafes = await this.prisma.cafe.count({
      where: { status: 'REJECTED' },
    });
    const totalUsers = await this.prisma.cafeAdmin.count();

    return {
      totalCafes,
      pendingCafes,
      activeCafes,
      rejectedCafes,
      totalUsers,
    };
  }

  async getSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    // Convert array to object for easier frontend consumption
    return settings.reduce((acc: Record<string, string>, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  }

  async updateSetting(key: string, value: string) {
    return this.prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async approveCafe(cafeId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const cafe = await prisma.cafe.update({
        where: { id: cafeId },
        data: { status: 'APPROVED', isActive: true },
      });

      // Approve all admins for this cafe
      await prisma.cafeAdmin.updateMany({
        where: { cafeId: cafeId },
        data: { isApproved: true, isActive: true },
      });

      return cafe;
    });
  }

  async rejectCafe(cafeId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const cafe = await prisma.cafe.update({
        where: { id: cafeId },
        data: { status: 'REJECTED', isActive: false },
      });

      // Deactivate all admins
      await prisma.cafeAdmin.updateMany({
        where: { cafeId: cafeId },
        data: { isApproved: false, isActive: false },
      });

      return cafe;
    });
  }

  async extendSubscription(cafeId: string, months: number) {
    const cafe = await this.prisma.cafe.findUnique({
      where: { id: cafeId },
    });

    if (!cafe) {
      throw new BadRequestException('Cafe bulunamadı.');
    }

    const now = new Date();
    let newEndDate = now;

    if (cafe.isSubscriptionActive && cafe.subscriptionEndsAt && cafe.subscriptionEndsAt > now) {
      // If active, extend from the current end date
      newEndDate = new Date(cafe.subscriptionEndsAt);
    }

    // Add months
    newEndDate.setMonth(newEndDate.getMonth() + months);

    return this.prisma.cafe.update({
      where: { id: cafeId },
      data: {
        isSubscriptionActive: true,
        plan: 'pro',
        subscriptionEndsAt: newEndDate,
        // If it was in trial, trial logic is superseded by pro subscription
      },
    });
  }
}
