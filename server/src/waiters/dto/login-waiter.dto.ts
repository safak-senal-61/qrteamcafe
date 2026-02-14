import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginWaiterDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
