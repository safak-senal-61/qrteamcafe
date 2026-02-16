import { Controller, Get, Param, Patch, Post, Body } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { RegisterSuperAdminDto } from './dto/register-super-admin.dto';
import { SendAnnouncementEmailDto } from './dto/send-announcement-email.dto';

@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Post('register')
  register(@Body() dto: RegisterSuperAdminDto) {
    return this.superAdminService.register(dto);
  }

  @Post('send-announcement-email')
  sendAnnouncementEmail(@Body() dto: SendAnnouncementEmailDto) {
    return this.superAdminService.sendAnnouncementEmail(dto);
  }

  @Get('pending-cafes')
  getPendingCafes() {
    return this.superAdminService.getPendingCafes();
  }

  @Get('stats')
  getStats() {
    return this.superAdminService.getDashboardStats();
  }

  @Get('expiring-subscriptions')
  getExpiringSubscriptions() {
    return this.superAdminService.getExpiringSubscriptions();
  }

  @Get('financial-stats')
  getFinancialStats() {
    return this.superAdminService.getFinancialStats();
  }

  @Get('recent-logs')
  getRecentLogs() {
    return this.superAdminService.getRecentLogs();
  }

  @Get('cafes')
  getAllCafes() {
    return this.superAdminService.getAllCafes();
  }

  @Get('settings')
  getSettings() {
    return this.superAdminService.getSettings();
  }

  @Patch('settings')
  updateSetting(@Body() body: { key: string; value: string }) {
    return this.superAdminService.updateSetting(body.key, body.value);
  }

  @Patch('cafes/:id/approve')
  approveCafe(@Param('id') id: string) {
    return this.superAdminService.approveCafe(id);
  }

  @Patch('cafes/:id/reject')
  rejectCafe(@Param('id') id: string) {
    return this.superAdminService.rejectCafe(id);
  }

  @Post('cafes/:id/subscription')
  extendSubscription(
    @Param('id') id: string,
    @Body() body: { months: number },
  ) {
    return this.superAdminService.extendSubscription(id, body.months);
  }
}
