import { Controller, Get, Patch, Body, Param, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CafesService } from './cafes.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('cafes')
export class CafesController {
  constructor(private readonly cafesService: CafesService) {}

  @Get('my-stats')
  getStats(@Query('cafeId') cafeId: string) {
    return this.cafesService.getDashboardStats(cafeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cafesService.findOne(id);
  }

  @Patch(':id/logo')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/logos',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `cafe-logo-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return callback(new BadRequestException('Sadece resim dosyaları yüklenebilir!'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  async uploadLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Dosya yüklenemedi.');
    }
    // API URL should be dynamic based on environment, but for now assuming standard setup
    const logoUrl = `/uploads/logos/${file.filename}`;
    return this.cafesService.update(id, { logoUrl });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.cafesService.update(id, body);
  }
}
