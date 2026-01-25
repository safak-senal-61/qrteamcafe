import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateRewardDto {
  @IsString()
  @IsNotEmpty()
  cafeId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  pointsCost: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
