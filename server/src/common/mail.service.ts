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

  async sendStaffInvitation(
    email: string,
    token: string,
    role: string,
    cafeName: string,
    clientOrigin?: string,
  ) {
    const roleName = role === 'KITCHEN' ? 'Mutfak Personeli' : 'Garson';
    const clientUrl =
      clientOrigin || process.env.CLIENT_URL || 'http://localhost:3000';
    const link = `${clientUrl}/tr/waiter/complete-registration?token=${token}`;

    const mailOptions = {
      from: `"QR Team Cafe" <${process.env.MAIL_USER}>`,
      to: email,
      subject: `${cafeName} - Personel Daveti`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Ekibe Davet Edildiniz!</h2>
          <p style="color: #666; font-size: 16px;">Merhaba,</p>
          <p style="color: #666; font-size: 16px;"><strong>${cafeName}</strong> sizi <strong>${roleName}</strong> olarak ekibine katılmaya davet ediyor.</p>
          <p style="color: #666; font-size: 16px;">Hesabınızı oluşturmak ve şifrenizi belirlemek için aşağıdaki butona tıklayın:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Daveti Kabul Et</a>
          </div>
          <p style="color: #666; font-size: 14px;">Veya aşağıdaki bağlantıyı tarayıcınıza yapıştırın:</p>
          <p style="color: #007bff; font-size: 12px; word-break: break-all;">${link}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">Bu davet 1 saat süreyle geçerlidir.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Invitation email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}
