import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterCafeDto } from './dto/register-cafe.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { MailService } from './mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtService } from '@nestjs/jwt';
import { generateSecret, generateURI, verify } from 'otplib';
import { toDataURL } from 'qrcode';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';

import { RegisterCustomerDto } from './dto/register-customer.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {}

  async registerCustomer(dto: RegisterCustomerDto) {
    const email = dto.email.toLowerCase();

    // Check for existing customer with same email or phone
    const whereConditions: any[] = [{ email }];
    if (dto.phone) {
      whereConditions.push({ phone: dto.phone });
    }

    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        OR: whereConditions,
      },
    });

    const existingCafeAdmin = await this.prisma.cafeAdmin.findUnique({
      where: { email },
    });

    const existingSuperAdmin = await this.prisma.superAdmin.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      if (existingCustomer.email === email) {
        throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');
      }
      if (dto.phone && existingCustomer.phone === dto.phone) {
        throw new BadRequestException('Bu telefon numarası zaten kullanımda.');
      }
    }

    if (existingCafeAdmin || existingSuperAdmin) {
      throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');
    }

    // Check referral code
    let referredById: string | null = null;
    if (dto.referralCode) {
      const referrer = await this.prisma.customer.findUnique({
        where: { referralCode: dto.referralCode },
      });
      if (referrer) {
        referredById = referrer.id;
      }
    }

    // Generate own referral code
    const referralCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const customer = await this.prisma.customer.create({
      data: {
        email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        isVerified: false,
        verificationCode,
        verificationCodeExpires,
        referralCode,
        referredById,
      },
    });

    // Send verification email
    if (customer.email) {
      await this.mailService.sendVerificationEmail(
        customer.email,
        verificationCode,
      );
    }

    return {
      message:
        'Kayıt başarılı. Lütfen e-posta adresinize gönderilen doğrulama kodunu giriniz.',
      requiresVerification: true,
      email: customer.email,
    };
  }

  async verifyCustomer(dto: VerifyCodeDto) {
    const email = dto.email.toLowerCase();
    const customer = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    if (customer.isVerified) {
      throw new BadRequestException('Hesap zaten doğrulanmış.');
    }

    if (
      customer.verificationCode !== dto.code ||
      !customer.verificationCodeExpires ||
      customer.verificationCodeExpires < new Date()
    ) {
      throw new BadRequestException(
        'Geçersiz veya süresi dolmuş doğrulama kodu.',
      );
    }

    // Verify account
    const updatedCustomer = await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });

    // Reward referrer if exists
    if (customer.referredById) {
      try {
        await this.prisma.customer.update({
          where: { id: customer.referredById },
          data: { loyaltyPoints: { increment: 100 } },
        });
      } catch (_error) {
        console.error('Error rewarding referrer:', _error);
        // Don't fail the verification if reward fails
      }
    }

    // Generate token
    const token = this.jwtService.sign({
      sub: updatedCustomer.id,
      email: updatedCustomer.email,
      role: 'customer',
    });

    return {
      token,
      customer: {
        id: updatedCustomer.id,
        email: updatedCustomer.email,
        name: updatedCustomer.name,
        phone: updatedCustomer.phone,
        referralCode: updatedCustomer.referralCode,
      },
    };
  }

  async loginCustomer(dto: LoginDto) {
    const email = dto.email.toLowerCase();
    const customer = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    if (!customer.passwordHash) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      customer.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    if (!customer.isVerified) {
      // If code expired, generate new one? For now just block.
      // Or maybe throw a specific error so frontend can redirect to verify screen?
      throw new UnauthorizedException({
        message: 'Hesabınız henüz doğrulanmamış.',
        code: 'NOT_VERIFIED',
        email: customer.email,
      });
    }

    // Generate referral code if missing (backfill for existing users)
    let referralCode = customer.referralCode;
    if (!referralCode) {
      referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      // Ensure uniqueness check could be good here but low collision prob for now
      try {
        await this.prisma.customer.update({
          where: { id: customer.id },
          data: { referralCode },
        });
      } catch {
        // If collision, try one more time
        referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await this.prisma.customer.update({
          where: { id: customer.id },
          data: { referralCode },
        });
      }
    }

    const token = this.jwtService.sign({
      sub: customer.id,
      email: customer.email,
      role: 'customer',
    });

    return {
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        referralCode: referralCode,
      },
    };
  }

  async changePassword(dto: ChangePasswordDto) {
    // Try to find in CafeAdmin
    const cafeAdmin = await this.prisma.cafeAdmin.findUnique({
      where: { id: dto.userId },
    });

    if (cafeAdmin) {
      const isPasswordValid = await bcrypt.compare(
        dto.oldPassword,
        cafeAdmin.passwordHash,
      );
      if (!isPasswordValid) {
        throw new BadRequestException('Mevcut şifre hatalı.');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(dto.newPassword, salt);

      await this.prisma.cafeAdmin.update({
        where: { id: cafeAdmin.id },
        data: { passwordHash },
      });

      return { message: 'Şifreniz başarıyla güncellendi.' };
    }

    // Try SuperAdmin
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { id: dto.userId },
    });

    if (superAdmin) {
      const isPasswordValid = await bcrypt.compare(
        dto.oldPassword,
        superAdmin.passwordHash,
      );
      if (!isPasswordValid) {
        throw new BadRequestException('Mevcut şifre hatalı.');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(dto.newPassword, salt);

      await this.prisma.superAdmin.update({
        where: { id: superAdmin.id },
        data: { passwordHash },
      });

      return { message: 'Şifreniz başarıyla güncellendi.' };
    }

    throw new NotFoundException('Kullanıcı bulunamadı.');
  }

  async sendCafeRegistrationVerificationCode(email: string) {
    const normalizedEmail = email.toLowerCase();

    // Check if email already registered
    const existingCafeAdmin = await this.prisma.cafeAdmin.findUnique({
      where: { email: normalizedEmail },
    });
    const existingSuperAdmin = await this.prisma.superAdmin.findUnique({
      where: { email: normalizedEmail },
    });
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingCafeAdmin || existingSuperAdmin || existingCustomer) {
      throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.prisma.emailVerification.upsert({
      where: { email: normalizedEmail },
      update: { code, expiresAt },
      create: { email: normalizedEmail, code, expiresAt },
    });

    await this.mailService.sendVerificationEmail(normalizedEmail, code);
    return { message: 'Doğrulama kodu gönderildi.' };
  }

  async registerCafe(dto: RegisterCafeDto) {
    const email = dto.email.toLowerCase();
    const existingCafeAdmin = await this.prisma.cafeAdmin.findUnique({
      where: { email },
    });

    const existingSuperAdmin = await this.prisma.superAdmin.findUnique({
      where: { email },
    });

    const existingCustomer = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (existingCafeAdmin || existingSuperAdmin || existingCustomer) {
      throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');
    }

    // Verify Code
    const verification = await this.prisma.emailVerification.findUnique({
      where: { email },
    });

    if (
      !verification ||
      verification.code !== dto.verificationCode ||
      verification.expiresAt < new Date()
    ) {
      console.log('Verification failed details:', {
        email: email,
        receivedCode: dto.verificationCode,
        dbCode: verification?.code,
        expiresAt: verification?.expiresAt,
        now: new Date()
      });
      throw new BadRequestException(
        'Geçersiz veya süresi dolmuş doğrulama kodu.',
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const slug = dto.cafeName
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');

    const result = await this.prisma.$transaction(async (prisma) => {
      const cafe = await prisma.cafe.create({
        data: {
          name: dto.cafeName,
          slug: `${slug}-${Date.now()}`,
          phone: dto.phone,
          status: 'PENDING',
          // 30 days trial
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          plan: 'trial',
        },
      });

      const admin = await prisma.cafeAdmin.create({
        data: {
          cafeId: cafe.id,
          name: dto.fullName,
          email,
          passwordHash: passwordHash,
          isApproved: false,
        },
      });

      // Consume verification code
      await prisma.emailVerification.delete({
        where: { email },
      });

      return { cafe, admin };
    });

    return {
      message: 'Başvurunuz alındı. Onaylandıktan sonra giriş yapabilirsiniz.',
      cafeId: result.cafe.id,
    };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const email = dto.email.toLowerCase();

    // First try to find CafeAdmin
    const cafeAdmin = await this.prisma.cafeAdmin.findUnique({
      where: { email },
      include: { cafe: true },
    });

    // Then try to find SuperAdmin
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { email },
    });

    if (!cafeAdmin && !superAdmin) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    // Determine which user type we found
    // If both exist (shouldn't happen due to registration checks but possible if DB manipulated directly), prefer CafeAdmin or handle logic.
    // Assuming email uniqueness across tables is enforced or handled:
    const user = cafeAdmin || superAdmin;
    const role = cafeAdmin ? 'CAFE_ADMIN' : 'SUPER_ADMIN';

    // Type guard / checking specific properties
    const passwordHash = user?.passwordHash;
    if (!passwordHash) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    if (cafeAdmin) {
      if (!cafeAdmin.isApproved) {
        throw new UnauthorizedException('Hesabınız henüz onaylanmamış.');
      }
      if (!cafeAdmin.isActive || !cafeAdmin.cafe.isActive) {
        throw new UnauthorizedException(
          'Hesabınız veya işletmeniz pasif durumda.',
        );
      }
    }

    // 2FA Check
    if (cafeAdmin && cafeAdmin.isTwoFactorEnabled) {
      if (!dto.twoFactorCode) {
        // Return special response indicating 2FA is required
        throw new UnauthorizedException({
          message: '2FA_REQUIRED',
          code: '2FA_REQUIRED',
        });
      }

      const verifyResult = await verify({
        token: dto.twoFactorCode,
        secret: cafeAdmin.twoFactorSecret || '',
      });

      if (!verifyResult.valid) {
        throw new UnauthorizedException('Geçersiz 2FA kodu.');
      }
    }

    // Create Session (only for CafeAdmin for now as schema supports it)
    let sessionId: string | undefined;
    if (cafeAdmin) {
      const session = await this.prisma.adminSession.create({
        data: {
          adminId: cafeAdmin.id,
          device: userAgent || 'Unknown',
          ip: ip || 'Unknown',
          token: randomBytes(32).toString('hex'),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
      sessionId = session.id;
    }

    // Generate Token
    const payload = {
      sub: user?.id,
      email: user?.email,
      role,
      sessionId,
      cafeId: cafeAdmin ? cafeAdmin.cafeId : undefined,
    };

    const token = this.jwtService.sign(payload);

    return {
      message: 'Giriş başarılı',
      token,
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role,
        cafeId: cafeAdmin ? cafeAdmin.cafeId : undefined,
        isTwoFactorEnabled: cafeAdmin ? cafeAdmin.isTwoFactorEnabled : false,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase();
    const admin = await this.prisma.cafeAdmin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new NotFoundException(
        'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.',
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.cafeAdmin.update({
      where: { id: admin.id },
      data: {
        resetCode: code,
        resetCodeExpires: expires,
      },
    });

    await this.mailService.sendPasswordResetEmail(admin.email, code);

    return { message: 'Şifre sıfırlama kodu e-posta adresinize gönderildi.' };
  }

  async verifyResetCode(dto: VerifyCodeDto) {
    const admin = await this.prisma.cafeAdmin.findUnique({
      where: { email: dto.email },
    });

    if (
      !admin ||
      admin.resetCode !== dto.code ||
      !admin.resetCodeExpires ||
      admin.resetCodeExpires < new Date()
    ) {
      throw new BadRequestException('Geçersiz veya süresi dolmuş kod.');
    }

    return { message: 'Kod doğrulandı.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const admin = await this.prisma.cafeAdmin.findUnique({
      where: { email: dto.email },
    });

    if (
      !admin ||
      admin.resetCode !== dto.code ||
      !admin.resetCodeExpires ||
      admin.resetCodeExpires < new Date()
    ) {
      throw new BadRequestException('Geçersiz veya süresi dolmuş kod.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.cafeAdmin.update({
      where: { id: admin.id },
      data: {
        passwordHash,
        resetCode: null,
        resetCodeExpires: null,
      },
    });

    return {
      message:
        'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.',
    };
  }

  // --- Customer Password Reset ---

  async forgotPasswordCustomer(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase();
    const customer = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      throw new NotFoundException(
        'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.',
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        resetCode: code,
        resetCodeExpires: expires,
      },
    });

    if (customer.email) {
      await this.mailService.sendPasswordResetEmail(customer.email, code);
    }

    return { message: 'Şifre sıfırlama kodu e-posta adresinize gönderildi.' };
  }

  async verifyResetCodeCustomer(dto: VerifyCodeDto) {
    const email = dto.email.toLowerCase();
    const customer = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (
      !customer ||
      customer.resetCode !== dto.code ||
      !customer.resetCodeExpires ||
      customer.resetCodeExpires < new Date()
    ) {
      throw new BadRequestException('Geçersiz veya süresi dolmuş kod.');
    }

    return { message: 'Kod doğrulandı.' };
  }

  async resetPasswordCustomer(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase();
    const customer = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (
      !customer ||
      customer.resetCode !== dto.code ||
      !customer.resetCodeExpires ||
      customer.resetCodeExpires < new Date()
    ) {
      throw new BadRequestException('Geçersiz veya süresi dolmuş kod.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        passwordHash,
        resetCode: null,
        resetCodeExpires: null,
      },
    });

    return {
      message:
        'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.',
    };
  }

  async getProfile(userId: string) {
    const cafeAdmin = await this.prisma.cafeAdmin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isTwoFactorEnabled: true,
        cafe: {
          select: {
            id: true,
            trialEndsAt: true,
            subscriptionEndsAt: true,
            isSubscriptionActive: true,
            plan: true,
          },
        },
      },
    });

    if (cafeAdmin) {
      return { ...cafeAdmin, role: 'CAFE_ADMIN' };
    }

    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (superAdmin) {
      return { ...superAdmin, role: 'SUPER_ADMIN', isTwoFactorEnabled: false };
    }

    throw new NotFoundException('Kullanıcı bulunamadı.');
  }

  // --- 2FA Methods ---

  async generate2FASecret(userId: string) {
    const user = await this.prisma.cafeAdmin.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    const secret = generateSecret();
    const otpauthUrl = generateURI({
      secret,
      issuer: 'QR Team Cafe',
      label: user.email,
    });

    // Temporarily save secret to verify later, or return it to be sent back?
    // Usually we save it to DB but not enabled yet.
    await this.prisma.cafeAdmin.update({
      where: { id: userId },
      data: { twoFactorSecret: secret }, // Not enabled yet
    });

    const qrCodeUrl = await toDataURL(otpauthUrl);

    return { secret, qrCodeUrl };
  }

  async enable2FA(userId: string, code: string) {
    const user = await this.prisma.cafeAdmin.findUnique({
      where: { id: userId },
    });
    if (!user || !user.twoFactorSecret)
      throw new BadRequestException('2FA kurulumu başlatılmamış.');

    const verifyResult = await verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!verifyResult.valid) throw new BadRequestException('Geçersiz kod.');

    await this.prisma.cafeAdmin.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });

    return { message: '2FA başarıyla etkinleştirildi.' };
  }

  async disable2FA(userId: string) {
    await this.prisma.cafeAdmin.update({
      where: { id: userId },
      data: {
        isTwoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
    return { message: '2FA devre dışı bırakıldı.' };
  }

  // --- Session Methods ---

  async getSessions(userId: string) {
    return this.prisma.adminSession.findMany({
      where: { adminId: userId },
      orderBy: { lastActive: 'desc' },
      select: {
        id: true,
        device: true,
        ip: true,
        lastActive: true,
        createdAt: true,
      },
    });
  }

  async terminateSession(userId: string, sessionId: string) {
    const session = await this.prisma.adminSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.adminId !== userId)
      throw new NotFoundException('Oturum bulunamadı.');

    await this.prisma.adminSession.delete({ where: { id: sessionId } });
    return { message: 'Oturum sonlandırıldı.' };
  }

  async terminateAllOtherSessions(userId: string, currentSessionId?: string) {
    const whereClause: Prisma.AdminSessionWhereInput = { adminId: userId };
    if (currentSessionId) {
      whereClause.id = { not: currentSessionId };
    }

    await this.prisma.adminSession.deleteMany({
      where: whereClause,
    });
    return { message: 'Diğer tüm oturumlar sonlandırıldı.' };
  }
}
