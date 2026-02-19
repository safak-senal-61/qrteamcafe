import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterSuperAdminDto } from './dto/register-super-admin.dto';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { SuperAdminMailService } from './super-admin-mail.service';
import {
  SendAnnouncementEmailDto,
  EmailTarget,
} from './dto/send-announcement-email.dto';

@Injectable()
export class SuperAdminService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private mailService: SuperAdminMailService,
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

  async sendAnnouncementEmail(dto: SendAnnouncementEmailDto) {
    let emails: string[] = [];

    if (
      dto.target === EmailTarget.ALL_CAFE_OWNERS ||
      dto.target === EmailTarget.EVERYONE
    ) {
      const cafeAdmins = await this.prisma.cafeAdmin.findMany({
        select: { email: true },
        // email is required in CafeAdmin, no need to filter nulls
      });
      emails.push(...cafeAdmins.map((admin) => admin.email));
    }

    if (dto.target === EmailTarget.SINGLE_CAFE) {
      if (!dto.cafeId) {
        throw new BadRequestException(
          'Cafe ID is required for SINGLE_CAFE target',
        );
      }

      const cafeAdmins = await this.prisma.cafeAdmin.findMany({
        where: { cafeId: dto.cafeId },
        select: { email: true },
      });

      const cafe = await this.prisma.cafe.findUnique({
        where: { id: dto.cafeId },
        select: { email: true },
      });

      if (cafe?.email) {
        emails.push(cafe.email);
      }

      emails.push(...cafeAdmins.map((admin) => admin.email));
    }

    if (
      dto.target === EmailTarget.ALL_USERS ||
      dto.target === EmailTarget.EVERYONE
    ) {
      const customers = await this.prisma.customer.findMany({
        select: { email: true },
        where: { email: { not: null } },
      });

      const customerEmails = customers
        .map((c) => c.email)
        .filter((email): email is string => email !== null);

      emails.push(...customerEmails);
    }

    // Remove duplicates
    emails = [...new Set(emails)];

    if (emails.length === 0) {
      return {
        message: 'Hedef kitlede gönderilecek e-posta adresi bulunamadı.',
      };
    }

    // Send emails asynchronously
    await this.mailService.sendAnnouncementEmail(
      emails,
      dto.subject,
      dto.content,
    );

    return {
      message: `${emails.length} kişiye e-posta gönderimi başlatıldı.`,
    };
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
    const totalOrders = await this.prisma.order.count();

    const trialCafes = await this.prisma.cafe.count({
      where: { plan: 'trial' },
    });
    const premiumCafes = await this.prisma.cafe.count({
      where: { plan: { not: 'trial' } },
    });

    return {
      totalCafes,
      pendingCafes,
      activeCafes,
      rejectedCafes,
      totalUsers,
      totalOrders,
      subscriptionStats: {
        trial: trialCafes,
        premium: premiumCafes,
      },
    };
  }

  async getExpiringSubscriptions() {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const now = new Date();

    return this.prisma.cafe.findMany({
      where: {
        isSubscriptionActive: true,
        subscriptionEndsAt: {
          lte: sevenDaysFromNow,
          gte: now,
        },
      },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionEndsAt: true,
        admins: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        subscriptionEndsAt: 'asc',
      },
    });
  }

  async getFinancialStats() {
    const trialCafes = await this.prisma.cafe.count({
      where: { plan: 'trial' },
    });
    const proCafes = await this.prisma.cafe.count({
      where: { plan: 'pro' },
    });
    const enterpriseCafes = await this.prisma.cafe.count({
      where: { plan: 'enterprise' },
    });
    const activeSubscriptions = await this.prisma.cafe.count({
      where: { isSubscriptionActive: true },
    });

    // Get cafes expiring in the next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringCafes = await this.prisma.cafe.findMany({
      where: {
        isSubscriptionActive: true,
        subscriptionEndsAt: {
          lte: sevenDaysFromNow,
          gte: new Date(),
        },
      },
      select: {
        id: true,
        name: true,
        subscriptionEndsAt: true,
        plan: true,
      },
      orderBy: {
        subscriptionEndsAt: 'asc',
      },
    });

    return {
      trialCafes,
      proCafes,
      enterpriseCafes,
      activeSubscriptions,
      expiringCafes,
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

    if (
      cafe.isSubscriptionActive &&
      cafe.subscriptionEndsAt &&
      cafe.subscriptionEndsAt > now
    ) {
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
