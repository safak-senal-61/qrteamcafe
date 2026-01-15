import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Kategori adı gereklidir.' })
  @IsString({ message: 'Kategori adı metin olmalıdır.' })
  name: string;

  @IsOptional()
  @IsInt({ message: 'Sıralama sayı olmalıdır.' })
  sortOrder?: number;
}
