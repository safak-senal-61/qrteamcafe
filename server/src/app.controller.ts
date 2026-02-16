import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('system-status')
  async getSystemStatus() {
    const status = await this.appService.getSystemStatus();
    return status;
  }

  @Post('contact-support')
  async contactSupport(@Body() body: { email: string; message: string }) {
    await this.appService.sendSupportEmail(body.email, body.message);
    return { success: true };
  }
}
