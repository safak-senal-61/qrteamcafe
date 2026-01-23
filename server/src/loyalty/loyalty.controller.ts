import { Controller, Get, Post, Body, Param, UseGuards, Request, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @UseGuards(JwtAuthGuard)
  @Get('history')
  getHistory(@Request() req: any) {
    return this.loyaltyService.getHistory(req.user.id);
  }

  @Get('rewards/:cafeId')
  getRewards(@Param('cafeId') cafeId: string) {
    return this.loyaltyService.getRewards(cafeId);
  }

  @Get('admin/rewards/:cafeId')
  getRewardsForAdmin(@Param('cafeId') cafeId: string) {
    return this.loyaltyService.getRewardsForAdmin(cafeId);
  }

  @Post('rewards')
  createReward(@Body() body: any) {
    return this.loyaltyService.createReward(body);
  }

  @Delete('rewards/:id')
  deleteReward(@Param('id') id: string) {
    return this.loyaltyService.deleteReward(id);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `/uploads/${file.filename}`,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('redeem')
  redeemReward(@Request() req: any, @Body('rewardId') rewardId: string) {
    return this.loyaltyService.redeemReward(req.user.id, rewardId);
  }
}
