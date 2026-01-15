import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
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
  price: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
