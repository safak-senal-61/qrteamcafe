import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWaiterDto } from './dto/create-waiter.dto';
import { LoginWaiterDto } from './dto/login-waiter.dto';
import { UpdateWaiterStatusDto } from './dto/update-waiter-status.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { EventsGateway } from '../events/events.gateway';
import { MailService } from '../common/mail.service';

@Injectable()
export class WaitersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private eventsGateway: EventsGateway,
    private mailService: MailService,
  ) {}

  async register(dto: CreateWaiterDto) {
    const existing = await this.prisma.waiter.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Bu e-posta adresi zaten kayıtlı.');
    }

    if (dto.phone) {
      const existingPhone = await this.prisma.waiter.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) {
        throw new BadRequestException('Bu telefon numarası zaten kayıtlı.');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Generate 6 digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const waiter = await this.prisma.waiter.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        nationalId: dto.nationalId,
        cafeId: dto.cafeId,
        passwordHash,
        status: 'PENDING_APPROVAL', // Will stay pending approval even after verification, until admin approves
        emailVerified: false,
        verificationCode,
        verificationCodeExpiresAt,
      },
    });

    // Send email
    await this.mailService.sendVerificationCode(waiter.email!, verificationCode);

    return { message: 'Kayıt başarılı. Lütfen e-posta adresinize gelen kodu girin.', waiterId: waiter.id, email: waiter.email };
  }

  async verifyEmail(email: string, code: string) {
    const waiter = await this.prisma.waiter.findUnique({
      where: { email },
    });

    if (!waiter) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    if (waiter.emailVerified) {
      return { message: 'E-posta zaten doğrulanmış.', verified: true };
    }

    if (waiter.verificationCode !== code) {
      throw new BadRequestException('Geçersiz doğrulama kodu.');
    }

    if (waiter.verificationCodeExpiresAt && waiter.verificationCodeExpiresAt < new Date()) {
      throw new BadRequestException('Doğrulama kodunun süresi dolmuş.');
    }

    const updatedWaiter = await this.prisma.waiter.update({
      where: { id: waiter.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    });

    // Notify business owner only after verification
    this.eventsGateway.notifyNewWaiterRegistration(updatedWaiter.cafeId, updatedWaiter);

    return { message: 'E-posta doğrulandı. Yönetici onayı bekleniyor.', verified: true };
  }

  async resendCode(email: string) {
    const waiter = await this.prisma.waiter.findUnique({
      where: { email },
    });

    if (!waiter) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    if (waiter.emailVerified) {
      throw new BadRequestException('E-posta zaten doğrulanmış.');
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.waiter.update({
      where: { id: waiter.id },
      data: {
        verificationCode,
        verificationCodeExpiresAt,
      },
    });

    await this.mailService.sendVerificationCode(waiter.email!, verificationCode);

    return { message: 'Doğrulama kodu tekrar gönderildi.' };
  }

  async login(dto: LoginWaiterDto) {
    const waiter = await this.prisma.waiter.findUnique({
      where: { email: dto.email },
      include: { cafe: true },
    });

    if (!waiter || !waiter.passwordHash) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    const isMatch = await bcrypt.compare(dto.password, waiter.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    if (!waiter.emailVerified) {
        throw new UnauthorizedException('Lütfen önce e-posta adresinizi doğrulayın.');
    }

    if (waiter.status !== 'ACTIVE') {
      throw new UnauthorizedException('Hesabınız yönetici tarafından onaylanmamış veya aktif değil.');
    }

    const sessionId = uuidv4();
    const payload = { sub: waiter.id, email: waiter.email, role: waiter.role, cafeId: waiter.cafeId, type: 'waiter', sessionId };
    const token = this.jwtService.sign(payload);

    // Update current session token for single device login
    await this.prisma.waiter.update({
      where: { id: waiter.id },
      data: { currentSessionToken: sessionId },
    });

    return { token, waiter: { 
      id: waiter.id, 
      firstName: waiter.firstName, 
      lastName: waiter.lastName,
      role: waiter.role,
      cafeName: waiter.cafe.name,
      cafeId: waiter.cafeId
    }};
  }

  async findAll(cafeId: string) {
    return this.prisma.waiter.findMany({
      where: { cafeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, dto: UpdateWaiterStatusDto, cafeId?: string) {
    const waiter = await this.prisma.waiter.findUnique({ where: { id } });
    if (!waiter) throw new NotFoundException('Garson bulunamadı.');

    if (cafeId && waiter.cafeId !== cafeId) {
        throw new UnauthorizedException('Bu garsonu yönetme yetkiniz yok.');
    }

    return this.prisma.waiter.update({
      where: { id },
      data: {
        status: dto.status,
        role: dto.role || waiter.role,
      },
    });
  }
  
  async findOne(id: string) {
    const waiter = await this.prisma.waiter.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        status: true,
        role: true,
        cafeId: true,
      }
    });
    return waiter;
  }
}
