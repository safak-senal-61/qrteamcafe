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
import { S3Service } from '../common/s3.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/subscription.guard';

const sanitizeFilename = (name: string): string => {
  const trMap: { [key: string]: string } = {
    ç: 'c',
    Ç: 'C',
    ğ: 'g',
    Ğ: 'G',
    ı: 'i',
    I: 'i',
    İ: 'i',
    ö: 'o',
    Ö: 'O',
    ş: 's',
    Ş: 'S',
    ü: 'u',
    Ü: 'U',
  };
  return name
    .split('')
    .map((char) => trMap[char] || char)
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
};

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly imageService: ImageService,
    private readonly s3Service: S3Service,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, callback) => {
          const ext = extname(file.originalname);

          if (req.body && typeof req.body.productName === 'string') {
            const sanitized = sanitizeFilename(req.body.productName);
            if (sanitized.length > 0) {
              // Kullanıcı sadece ürün adını istediği için timestamp eklemiyoruz
              callback(null, `${sanitized}${ext}`);
              return;
            }
          }

          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `product-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    // Override filename if product name is present (fallback for Multer ordering issues)
    if (file && body && typeof body.productName === 'string') {
      const sanitized = sanitizeFilename(body.productName);
      if (sanitized.length > 0) {
        const ext = extname(file.originalname);
        file.filename = `${sanitized}${ext}`;
      }
    }

    // Process image (resize, transparent bg logic)
    if (file) {
      await this.imageService.processProductImage(file);
    }

    const s3Url = await this.s3Service.uploadFile(file, 'products');

    return {
      url: s3Url,
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

  @Get('gallery-images')
  @UseGuards(JwtAuthGuard)
  getGalleryImages(@Query('q') query?: string) {
    return this.productsService.getGalleryImages(query);
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
