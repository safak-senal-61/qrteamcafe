import { Controller, Post, Body, Req, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterCafeDto } from './dto/register-cafe.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';

import { RegisterCustomerDto } from './dto/register-customer.dto';

@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('customer/register')
  async registerCustomer(@Body() dto: RegisterCustomerDto) {
    return this.authService.registerCustomer(dto);
  }

  @Post('customer/verify')
  async verifyCustomer(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCustomer(dto);
  }

  @Post('customer/login')
  async loginCustomer(@Body() dto: LoginDto) {
    return this.authService.loginCustomer(dto);
  }

  @Post('customer/forgot-password')
  async forgotPasswordCustomer(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPasswordCustomer(dto);
  }

  @Post('customer/verify-code')
  async verifyCodeCustomer(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyResetCodeCustomer(dto);
  }

  @Post('customer/reset-password')
  async resetPasswordCustomer(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPasswordCustomer(dto);
  }

  @Post('change-password')
  async changePassword(@Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(dto);
  }

  @Post('register')
  async register(@Body() dto: RegisterCafeDto) {
    return this.authService.registerCafe(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ip, userAgent);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-code')
  async verifyCode(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyResetCode(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  // --- Security Endpoints ---

  @UseGuards(AuthGuard('jwt'))
  @Post('2fa/generate')
  async generate2FA(@Req() req: any) {
    return this.authService.generate2FASecret(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('2fa/enable')
  async enable2FA(@Req() req: any, @Body('code') code: string) {
    return this.authService.enable2FA(req.user.id, code);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('2fa/disable')
  async disable2FA(@Req() req: any) {
    return this.authService.disable2FA(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('sessions')
  async getSessions(@Req() req: any) {
    return this.authService.getSessions(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('sessions/:id')
  async terminateSession(@Req() req: any, @Param('id') sessionId: string) {
    return this.authService.terminateSession(req.user.id, sessionId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('sessions')
  async terminateAllOtherSessions(@Req() req: any) {
    return this.authService.terminateAllOtherSessions(req.user.id, req.user.sessionId);
  }
}
