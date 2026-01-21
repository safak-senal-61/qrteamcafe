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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('upload')
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
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    // Generate full URL
    // In production, use env variable for base URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    return {
      url: `${baseUrl}/uploads/${file.filename}`,
    };
  }

  @Post()
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
  toggleChefRecommendation(@Param('id') id: string, @Body('isChefRecommended') isChefRecommended: boolean) {
    return this.productsService.toggleChefRecommendation(id, isChefRecommended);
  }

  @Patch(':id/stock')
  updateStock(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.productsService.updateStock(id, Number(quantity));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
