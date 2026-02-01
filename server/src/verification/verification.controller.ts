import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerifyTcDto } from './dto/verify-tc.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('tc-verify')
  async verifyTc(@Body() verifyTcDto: VerifyTcDto) {
    return this.verificationService.verifyTcKimlik(verifyTcDto);
  }
}
