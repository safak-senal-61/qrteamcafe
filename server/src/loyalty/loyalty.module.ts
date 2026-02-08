import { Module } from '@nestjs/common';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Service } from '../common/s3.service';

@Module({
  imports: [PrismaModule],
  controllers: [LoyaltyController],
  providers: [LoyaltyService, S3Service],
})
export class LoyaltyModule {}
