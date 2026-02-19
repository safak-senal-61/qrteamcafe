import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class InitializePaymentDto {
  @IsString()
  @IsNotEmpty()
  ip: string;

  @IsString()
  @IsNotEmpty()
  contactName: string;

  @IsString()
  @IsNotEmpty()
  identityNumber: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  gsmNumber?: string;

  @IsString()
  @IsOptional()
  planDuration?: string;

  @IsString()
  @IsOptional()
  mode?: string;

  @IsOptional()
  storeCard?: boolean;
}
