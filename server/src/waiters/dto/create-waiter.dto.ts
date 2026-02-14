import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateWaiterDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsNotEmpty()
  @IsString()
  cafeId: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
