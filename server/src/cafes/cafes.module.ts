import { Module } from '@nestjs/common';
import { CafesController } from './cafes.controller';
import { CafesService } from './cafes.service';
import { S3Service } from '../common/s3.service';

@Module({
  controllers: [CafesController],
  providers: [CafesService, S3Service],
  exports: [CafesService],
})
export class CafesModule {}
