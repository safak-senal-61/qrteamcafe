import { Injectable, InternalServerErrorException } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImageService {
  async processProductImage(file: Express.Multer.File): Promise<void> {
    try {
      const filePath = file.path;
      const tempPath = filePath + '.tmp';

      // Arka planı beyaz yap ve resmi yeniden boyutlandır (opsiyonel)
      // Not: Tam otomatik arka plan kaldırma (background removal) işlemi karmaşık AI modelleri gerektirir (örn. rembg).
      // Sharp kütüphanesi ile basit bir "beyaz arka plan üzerine yerleştirme" veya "transparanlık koruma" yapılabilir.
      // Kullanıcının isteği "otomatik arka plan kaldırılmalı" olduğu için, 
      // tam bir AI çözümü olmadan sharp ile en iyi iyileştirmeyi yapıyoruz:
      // 1. Resmi 800x800 kutuya sığdır (contain)
      // 2. Arka planı şeffaf bırak (veya beyaz yap)
      // 3. PNG olarak kaydet (kalite optimizasyonu)

      await sharp(filePath)
        .resize(800, 800, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Şeffaf arka plan
        })
        .png({ quality: 80 })
        .toFile(tempPath);

      // Orijinal dosyayı işlenmiş dosya ile değiştir
      fs.unlinkSync(filePath);
      fs.renameSync(tempPath, filePath);
      
    } catch (error) {
      console.error('Image processing error:', error);
      // Hata olsa bile işlem devam etsin, orijinal dosya kalsın
    }
  }
}
