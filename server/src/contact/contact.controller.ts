import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from '../auth/mail.service';
import { ContactFormDto } from './dto/contact-form.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly mailService: MailService) {}

  @Post()
  async sendContactMessage(@Body() contactFormDto: ContactFormDto) {
    await this.mailService.sendContactFormEmail(contactFormDto);
    return { message: 'Message sent successfully' };
  }
}
