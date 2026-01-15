import { IsNotEmpty, IsInt, IsOptional, IsBoolean } from 'class-validator';

export class CreateTableDto {
  @IsNotEmpty({ message: 'Masa numarası gereklidir.' })
  @IsInt({ message: 'Masa numarası sayı olmalıdır.' })
  tableNumber: number;

  @IsOptional()
  @IsBoolean()
  isOccupied?: boolean;
}
