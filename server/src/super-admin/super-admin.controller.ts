import { Controller, Get, Param, Patch, Post, Body } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { RegisterSuperAdminDto } from './dto/register-super-admin.dto';

@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Post('register')
  register(@Body() dto: RegisterSuperAdminDto) {
    return this.superAdminService.register(dto);
  }

  @Get('pending-cafes')
  getPendingCafes() {
    return this.superAdminService.getPendingCafes();
  }

  @Get('stats')
  getStats() {
    return this.superAdminService.getDashboardStats();
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
