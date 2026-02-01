import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

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
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Şifre en az 1 büyük harf, 1 küçük harf ve 1 rakam veya özel karakter içermelidir.',
  })
  password: string;

  @IsNotEmpty({ message: 'Doğrulama kodu gereklidir.' })
  verificationCode: string;
}
