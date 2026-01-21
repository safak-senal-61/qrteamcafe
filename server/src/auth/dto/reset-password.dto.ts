import { IsEmail, IsNotEmpty, IsString, Length, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Şifre en az 1 büyük harf, 1 küçük harf ve 1 rakam veya özel karakter içermelidir.',
  })
  newPassword: string;
}
