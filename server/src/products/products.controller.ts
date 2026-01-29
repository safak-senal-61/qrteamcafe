import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ImageService } from '../common/image.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/subscription.guard';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly imageService: ImageService,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
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
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    // Process image (resize, transparent bg logic)
    if (file) {
      await this.imageService.processProductImage(file);
    }

    // Return relative path to allow frontend proxying (rewrites) to handle it
    // This ensures images work on all devices (localhost, LAN, production)
    return {
      url: `/uploads/${file.filename}`,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  create(
    @Body() createProductDto: CreateProductDto,
    @Query('cafeId') cafeId: string,
  ) {
    return this.productsService.create(cafeId, createProductDto);
  }

  @Get()
  findAll(@Query('cafeId') cafeId: string) {
    return this.productsService.findAll(cafeId);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  reorder(@Body() items: { id: string; sortOrder: number }[]) {
    // Reorder products
    return this.productsService.reorder(items);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/recommendations')
  getRecommendations(@Param('id') id: string) {
    return this.productsService.getRecommendations(id);
  }

  @Patch(':id/chef-recommendation')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  toggleChefRecommendation(
    @Param('id') id: string,
    @Body('isChefRecommended') isChefRecommended: boolean,
  ) {
    return this.productsService.toggleChefRecommendation(id, isChefRecommended);
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  updateStock(@Param('id') id: string, @Body('stock') stock: number) {
    return this.productsService.updateStock(id, stock);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
