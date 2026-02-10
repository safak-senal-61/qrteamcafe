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

  async sendCafeVerificationEmail(to: string, code: string, cafeName: string) {
    const mailOptions = {
      from: `"qrders" <${process.env.MAIL_USER}>`,
      to,
      subject: `${cafeName} - İşletme Doğrulama Kodu`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #d97706; text-align: center;">${cafeName} İşletme Başvurusu</h2>
          <p>Merhaba,</p>
          <p><strong>${cafeName}</strong> için qrders işletme başvurunuzu tamamlamak üzeresiniz. Lütfen aşağıdaki doğrulama kodunu kullanın:</p>
          <div style="background-color: #fffbeb; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #d97706; border: 1px solid #fcd34d;">
            ${code}
          </div>
          <p style="margin-top: 20px;">Bu kod 15 dakika boyunca geçerlidir.</p>
          <p>Eğer bu işlemi siz başlatmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">qrders Yönetim Sistemi</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendCustomerVerificationEmail(to: string, code: string, name: string) {
    const mailOptions = {
      from: `"qrders" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Hesap Doğrulama Kodu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #059669; text-align: center;">Aramıza Hoş Geldin, ${name}!</h2>
          <p>Merhaba ${name},</p>
          <p>qrders'e katıldığın için teşekkürler. Hesabını doğrulamak için lütfen aşağıdaki kodu kullan:</p>
          <div style="background-color: #ecfdf5; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #047857; border: 1px solid #a7f3d0;">
            ${code}
          </div>
          <p style="margin-top: 20px;">Bu kod 15 dakika boyunca geçerlidir.</p>
          <p>Keyifli siparişler dileriz!</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">qrders Ekibi</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendCafePasswordResetEmail(
    to: string,
    code: string,
    cafeName?: string,
  ) {
    const title = cafeName
      ? `${cafeName} Şifre Sıfırlama`
      : 'Şifre Sıfırlama Talebi';
    const greeting = cafeName ? `Merhaba ${cafeName} Yöneticisi,` : 'Merhaba,';

    const mailOptions = {
      from: `"qrders" <${process.env.MAIL_USER}>`,
      to,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #007bff; text-align: center;">${title}</h2>
          <p>${greeting}</p>
          <p>Hesabınız için bir şifre sıfırlama talebi aldık. Şifrenizi sıfırlamak için aşağıdaki kodu kullanın:</p>
          <div style="background-color: #eff6ff; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1d4ed8; border: 1px solid #bfdbfe;">
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

  async sendContactFormEmail(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    const mailOptions = {
      from: `"qrders Contact" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER, // Send to self
      replyTo: data.email,
      subject: `İletişim Formu: ${data.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #6366f1; text-align: center;">Yeni İletişim Mesajı</h2>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Gönderen:</strong> ${data.name}</p>
            <p><strong>E-posta:</strong> ${data.email}</p>
            <p><strong>Konu:</strong> ${data.subject}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;">
            <p><strong>Mesaj:</strong></p>
            <p style="white-space: pre-wrap; color: #334155;">${data.message}</p>
          </div>
          <p style="font-size: 12px; color: #64748b; text-align: center;">
            Bu mesaj qrders iletişim formundan gönderilmiştir.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendCustomerPasswordResetEmail(to: string, code: string, name: string) {
    const mailOptions = {
      from: `"qrders" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Şifre Sıfırlama Talebi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #007bff; text-align: center;">Şifre Sıfırlama</h2>
          <p>Merhaba ${name},</p>
          <p>Şifreni unuttun mu? Sorun değil. Şifreni sıfırlamak için aşağıdaki kodu kullanabilirsin:</p>
          <div style="background-color: #eff6ff; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1d4ed8; border: 1px solid #bfdbfe;">
            ${code}
          </div>
          <p style="margin-top: 20px;">Bu kod 15 dakika boyunca geçerlidir.</p>
          <p>Eğer bu talebi sen yapmadıysan, hesabın güvende demektir.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">qrders Ekibi</p>
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
