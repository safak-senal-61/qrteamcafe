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

  async sendPasswordResetEmail(to: string, code: string) {
    const mailOptions = {
      from: `"QR Team Cafe" <${process.env.MAIL_USER}>`,
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
          <p style="font-size: 12px; color: #888; text-align: center;">QR Team Cafe Yönetim Sistemi</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
