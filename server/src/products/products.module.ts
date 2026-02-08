import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ImageService } from '../common/image.service';
import { S3Service } from '../common/s3.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ImageService, S3Service],
  exports: [ProductsService],
})
export class ProductsModule {}
