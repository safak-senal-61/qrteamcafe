import { IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsOptional()
  @MinLength(6)
  twoFactorCode?: string;
}
