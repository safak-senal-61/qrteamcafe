import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SuperAdminMailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const port = Number(process.env.BREVO_SMTP_PORT);
    this.transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST,
      port: port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
      },
    });
  }

  async sendAnnouncementEmail(
    emails: string[],
    subject: string,
    content: string,
  ) {
    if (emails.length === 0) return true;

    // Split emails into chunks of 50 to avoid limits
    const chunkSize = 50;
    const fromAddress = process.env.BREVO_MAIL_FROM || 'noreply@qrders.com.tr';

    for (let i = 0; i < emails.length; i += chunkSize) {
      const chunk = emails.slice(i, i + chunkSize);
      const isFullHtml = /^\s*<!DOCTYPE|^\s*<html/i.test(content);
      const isHtmlFragment = /<[a-z][\s\S]*>/i.test(content);

      let htmlContent;

      if (isFullHtml) {
        // If content is a full HTML document, use it as is
        htmlContent = content;
      } else {
        // If content is plain text or partial HTML, wrap it in the template
        const formattedContent = isHtmlFragment
          ? content
          : content.replace(/\n/g, '<br>');

        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #333; text-align: center;">Duyuru</h2>
            <div style="color: #666; font-size: 16px; line-height: 1.5; margin: 20px 0;">
              ${formattedContent}
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
              QR Team Cafe - Bu e-posta bilgilendirme amaçlıdır.
            </p>
          </div>
        `;
      }

      const mailOptions = {
        from: `"QR Team Cafe" <${fromAddress}>`, // Sender address must be verified in Brevo
        bcc: chunk, // Use BCC to hide recipients
        subject: subject,
        html: htmlContent,
      };

      try {
        await this.transporter.sendMail(mailOptions);
        console.log(`Announcement email sent to chunk ${i / chunkSize + 1}`);
      } catch (error) {
        console.error('Error sending announcement email:', error);
        // Continue with next chunk even if one fails
      }
    }
    return true;
  }

  async sendSupportEmail(senderEmail: string, message: string) {
    const toAddress = 'help@qrders.com.tr';
    const fromAddress = process.env.BREVO_MAIL_FROM || 'noreply@qrders.com.tr';

    const mailOptions = {
      from: `"QR Team Cafe Support" <${fromAddress}>`,
      to: toAddress,
      replyTo: senderEmail,
      subject: `Yeni Destek Talebi (Bakım Modu) - ${senderEmail}`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Yeni Destek Talebi</h2>
          <p><strong>Gönderen:</strong> ${senderEmail}</p>
          <p><strong>Mesaj:</strong></p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Support email sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending support email:', error);
      throw error;
    }
  }
}
