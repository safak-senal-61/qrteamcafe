import { Injectable } from '@nestjs/common';
import { SuperAdminService } from '../super-admin/super-admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailTarget } from '../super-admin/dto/send-announcement-email.dto';

export enum UserState {
  IDLE = 'IDLE',
  WAITING_FOR_TARGET = 'WAITING_FOR_TARGET',
  WAITING_FOR_CAFE_SEARCH = 'WAITING_FOR_CAFE_SEARCH',
  WAITING_FOR_CAFE_SELECTION = 'WAITING_FOR_CAFE_SELECTION',
  WAITING_FOR_SUBJECT = 'WAITING_FOR_SUBJECT',
  WAITING_FOR_CONTENT = 'WAITING_FOR_CONTENT',
  CONFIRMATION = 'CONFIRMATION',
}

export interface UserSession {
  state: UserState;
  data: {
    target?: EmailTarget;
    cafeId?: string;
    cafeName?: string;
    subject?: string;
    content?: string;
  };
}

@Injectable()
export class TelegramService {
  private sessions = new Map<number, UserSession>();

  constructor(
    private superAdminService: SuperAdminService,
    private prisma: PrismaService,
  ) {}

  getSession(userId: number): UserSession {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, { state: UserState.IDLE, data: {} });
    }
    return this.sessions.get(userId)!;
  }

  updateSession(userId: number, update: Partial<UserSession>) {
    const session = this.getSession(userId);
    this.sessions.set(userId, { ...session, ...update });
  }

  clearSession(userId: number) {
    this.sessions.delete(userId);
  }

  async searchCafes(query: string) {
    return this.prisma.cafe.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      take: 5,
      select: { id: true, name: true },
    });
  }

  async getAllCafes() {
    return this.prisma.cafe.findMany({
      orderBy: { name: 'asc' },
      take: 50,
      select: { id: true, name: true },
    });
  }

  async getCafeName(id: string) {
    const cafe = await this.prisma.cafe.findUnique({
      where: { id },
      select: { name: true },
    });
    return cafe?.name || 'Bilinmeyen İşletme';
  }

  async getPendingCafes() {
    return this.superAdminService.getPendingCafes();
  }

  async approveCafe(id: string) {
    return this.superAdminService.approveCafe(id);
  }

  async rejectCafe(id: string) {
    return this.superAdminService.rejectCafe(id);
  }

  async getStats() {
    return this.superAdminService.getDashboardStats();
  }

  async getExpiringSubscriptions() {
    return this.superAdminService.getExpiringSubscriptions();
  }

  async getFinancialStats() {
    return this.superAdminService.getFinancialStats();
  }

  async getSettings() {
    return this.superAdminService.getSettings();
  }

  async updateSetting(key: string, value: string) {
    return this.superAdminService.updateSetting(key, value);
  }

  async sendEmail(userId: number) {
    const session = this.getSession(userId);
    const { target, cafeId, subject, content } = session.data;

    if (!target || !subject || !content) {
      throw new Error('Eksik bilgi.');
    }

    if (target === EmailTarget.SINGLE_CAFE && !cafeId) {
      throw new Error('İşletme seçilmedi.');
    }

    await this.superAdminService.sendAnnouncementEmail({
      target,
      cafeId,
      subject,
      content,
    });
  }
}
