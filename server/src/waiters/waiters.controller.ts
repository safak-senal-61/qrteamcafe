import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { WaitersService } from './waiters.service';
import { CreateWaiterDto } from './dto/create-waiter.dto';
import { LoginWaiterDto } from './dto/login-waiter.dto';
import { UpdateWaiterStatusDto } from './dto/update-waiter-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('waiters')
export class WaitersController {
  constructor(private readonly waitersService: WaitersService) {}

  @Post('register')
  register(@Body() createWaiterDto: CreateWaiterDto) {
    return this.waitersService.register(createWaiterDto);
  }

  @Post('verify-email')
  verifyEmail(@Body() body: { email: string; code: string }) {
    return this.waitersService.verifyEmail(body.email, body.code);
  }

  @Post('resend-code')
  resendCode(@Body() body: { email: string }) {
    return this.waitersService.resendCode(body.email);
  }

  @Post('login')
  login(@Body() loginWaiterDto: LoginWaiterDto) {
    return this.waitersService.login(loginWaiterDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req: any) {
    // Only CafeAdmin should access this
    if (req.user.role !== 'CAFE_ADMIN') {
        throw new ForbiddenException('Bu işlem için yetkiniz yok.');
    }
    return this.waitersService.findAll(req.user.cafeId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateWaiterStatusDto: UpdateWaiterStatusDto, @Request() req: any) {
      if (req.user.role !== 'CAFE_ADMIN') {
         throw new ForbiddenException('Bu işlem için yetkiniz yok.');
     }
     return this.waitersService.updateStatus(id, updateWaiterStatusDto, req.user.cafeId);
   }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return this.waitersService.findOne(req.user.id || req.user.sub);
  }
}
