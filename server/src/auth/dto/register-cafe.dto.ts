import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterCafeDto {
  @IsNotEmpty({ message: 'İşletme adı boş bırakılamaz.' })
  cafeName: string;

  @IsNotEmpty({ message: 'Ad Soyad boş bırakılamaz.' })
  fullName: string;

  @IsNotEmpty({ message: 'Telefon numarası boş bırakılamaz.' })
  phone: string;

  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz.' })
  email: string;

  @IsNotEmpty({ message: 'Şifre boş bırakılamaz.' })
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır.' })
  password: string;
}
