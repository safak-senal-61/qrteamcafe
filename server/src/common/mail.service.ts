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

  async sendVerificationCode(email: string, code: string) {
    const mailOptions = {
      from: `"QR Team Cafe" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Garson Hesabı Doğrulama Kodu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Hesap Doğrulama</h2>
          <p style="color: #666; font-size: 16px;">Merhaba,</p>
          <p style="color: #666; font-size: 16px;">Garson hesabınızı doğrulamak için aşağıdaki kodu kullanın:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 4px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #000;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px;">Bu kod 10 dakika süreyle geçerlidir.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">Eğer bu işlemi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}
