import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendVerificationEmail(to: string, code: string) {
    const mailOptions = {
      from: `"qrders" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Hesap Doğrulama Kodu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #059669; text-align: center;">Hoş Geldiniz!</h2>
          <p>Merhaba,</p>
          <p>qrders'e hoş geldiniz. Hesabınızı doğrulamak için lütfen aşağıdaki kodu kullanın:</p>
          <div style="background-color: #ecfdf5; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #047857; border: 1px solid #a7f3d0;">
            ${code}
          </div>
          <p style="margin-top: 20px;">Bu kod 15 dakika boyunca geçerlidir.</p>
          <p>Eğer bu hesabı siz oluşturmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">qrders Yönetim Sistemi</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(to: string, code: string) {
    const mailOptions = {
      from: `"qrders" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Şifre Sıfırlama Kodu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #007bff; text-align: center;">Şifre Sıfırlama Talebi</h2>
          <p>Merhaba,</p>
          <p>Hesabınız için bir şifre sıfırlama talebi aldık. Şifrenizi sıfırlamak için aşağıdaki kodu kullanın:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;">
            ${code}
          </div>
          <p style="margin-top: 20px;">Bu kod 15 dakika boyunca geçerlidir.</p>
          <p>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">qrders Yönetim Sistemi</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendEmailChangeVerificationEmail(to: string, code: string) {
    const mailOptions = {
      from: `"qrders" <${process.env.MAIL_USER}>`,
      to,
      subject: 'E-posta Değişikliği Doğrulama Kodu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #059669; text-align: center;">E-posta Değişikliği</h2>
          <p>Merhaba,</p>
          <p>E-posta adresinizi değiştirmek için bir talep aldık. İşlemi tamamlamak için lütfen aşağıdaki doğrulama kodunu kullanın:</p>
          <div style="background-color: #ecfdf5; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #047857; border: 1px solid #a7f3d0;">
            ${code}
          </div>
          <p style="margin-top: 20px;">Bu kod 15 dakika boyunca geçerlidir.</p>
          <p>Eğer bu talebi siz yapmadıysanız, lütfen bizimle iletişime geçin.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">qrders Yönetim Sistemi</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
