import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { RequestWithUser } from '../auth/interfaces';

import { CreateRewardDto } from './dto/create-reward.dto';

import { S3Service } from '../common/s3.service';

@Controller('loyalty')
export class LoyaltyController {
  constructor(
    private readonly loyaltyService: LoyaltyService,
    private readonly s3Service: S3Service,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('history')
  getHistory(@Request() req: RequestWithUser) {
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
  createReward(@Body() body: CreateRewardDto) {
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
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const s3Url = await this.s3Service.uploadFile(file, 'rewards');
    return {
      url: s3Url,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('redeem')
  redeemReward(
    @Request() req: RequestWithUser,
    @Body('rewardId') rewardId: string,
  ) {
    return this.loyaltyService.redeemReward(req.user.id, rewardId);
  }
}
