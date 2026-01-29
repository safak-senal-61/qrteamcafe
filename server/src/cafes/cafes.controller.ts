import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { CafesService } from './cafes.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UpdateCafeDto } from './dto/update-cafe.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/subscription.guard';

@Controller('cafes')
export class CafesController {
  constructor(private readonly cafesService: CafesService) {}

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.cafesService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cafesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get(':id/dashboard-stats')
  getDashboardStats(@Param('id') id: string) {
    return this.cafesService.getDashboardStats(id);
  }

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Patch(':id/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/logos',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `cafe-logo-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('Sadece resim dosyaları yüklenebilir!'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Dosya yüklenemedi.');
    }
    // API URL should be dynamic based on environment, but for now assuming standard setup
    const logoUrl = `/uploads/logos/${file.filename}`;
    return this.cafesService.update(id, { logoUrl });
  }

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Patch(':id/cover-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/covers',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `cafe-cover-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('Sadece resim dosyaları yüklenebilir!'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB for cover images
      },
    }),
  )
  async uploadCoverImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Dosya yüklenemedi.');
    }
    // API URL should be dynamic based on environment, but for now assuming standard setup
    const coverImageUrl = `/uploads/covers/${file.filename}`;
    return this.cafesService.update(id, { coverImageUrl });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  update(@Param('id') id: string, @Body() updateCafeDto: UpdateCafeDto) {
    return this.cafesService.update(id, updateCafeDto);
  }
}
