import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsNotEmpty({ message: 'Kategori seçimi zorunludur.' })
  @IsUUID('4', { message: 'Geçersiz kategori ID.' })
  categoryId: string;

  @IsNotEmpty({ message: 'Ürün adı gereklidir.' })
  @IsString({ message: 'Ürün adı metin olmalıdır.' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty({ message: 'Fiyat gereklidir.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Fiyat sayı olmalıdır.' })
  @Min(0, { message: 'Fiyat 0 veya daha büyük olmalıdır.' })
  price: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Stok sayı olmalıdır.' })
  @Min(0, { message: 'Stok 0 veya daha büyük olmalıdır.' })
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'İndirimsiz fiyat sayı olmalıdır.' })
  @Min(0, { message: 'İndirimsiz fiyat 0 veya daha büyük olmalıdır.' })
  originalPrice?: number;

  @IsOptional()
  @IsBoolean()
  isChefRecommended?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresPreparation?: boolean;
}
