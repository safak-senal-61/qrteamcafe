import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { RegisterSuperAdminDto } from './dto/register-super-admin.dto';
import { SendAnnouncementEmailDto } from './dto/send-announcement-email.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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

  @Get('cafes')
  getAllCafes() {
    return this.superAdminService.getAllCafes();
  }

  @Get('settings')
  getSettings() {
    return this.superAdminService.getSettings();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('settings')
  updateSetting(
    @Request() req: any,
    @Body() body: { key: string; value: string },
  ) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only Super Admins can update settings');
    }
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
