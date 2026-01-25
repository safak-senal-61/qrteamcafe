import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateReviewDto {
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}
