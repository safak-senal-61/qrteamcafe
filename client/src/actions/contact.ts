'use server';

import { resend, FROM_EMAIL } from '@/lib/resend';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type ContactState = {
  success?: boolean;
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    subject?: string[];
    message?: string[];
  };
};

export async function sendContactEmail(prevState: ContactState, formData: FormData): Promise<ContactState> {
  const validatedFields = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Lütfen form alanlarını kontrol ediniz.',
    };
  }

  const { name, email, subject, message } = validatedFields.data;

  try {
    // Send email to admin
    await resend.emails.send({
      from: `Qrders Contact <${FROM_EMAIL}>`,
      to: ['info@qrders.com.tr'],
      replyTo: email,
      subject: `[İletişim Formu] ${subject}`,
      text: `
        İsim: ${name}
        E-posta: ${email}
        Konu: ${subject}
        
        Mesaj:
        ${message}
      `,
      html: `
        <h3>Yeni İletişim Formu Mesajı</h3>
        <p><strong>İsim:</strong> ${name}</p>
        <p><strong>E-posta:</strong> ${email}</p>
        <p><strong>Konu:</strong> ${subject}</p>
        <hr />
        <p><strong>Mesaj:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    return {
      success: true,
      message: 'Mesajınız başarıyla gönderildi!',
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      message: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.',
    };
  }
}
