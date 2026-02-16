import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { SuperAdminMailService } from './super-admin/super-admin-mail.service';

@Injectable()
export class AppService {
  constructor(
    private prisma: PrismaService,
    private mailService: SuperAdminMailService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getSystemStatus() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'maintenanceMode' },
    });
    return { maintenanceMode: setting?.value === 'true' };
  }

  async sendSupportEmail(email: string, message: string) {
    return this.mailService.sendSupportEmail(email, message);
  }
}
