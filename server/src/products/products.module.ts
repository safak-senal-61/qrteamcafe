import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ImageService } from '../common/image.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ImageService],
  exports: [ProductsService],
})
export class ProductsModule {}
