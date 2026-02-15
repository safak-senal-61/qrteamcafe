import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateWaiterCallDto {
  @IsString()
  @IsNotEmpty()
  tableId: string;

  @IsString()
  @IsOptional()
  type?: string;
}
