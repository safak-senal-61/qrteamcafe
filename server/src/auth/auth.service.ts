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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {}

  async changePassword(dto: ChangePasswordDto) {
    // Try to find in CafeAdmin
    const cafeAdmin = await this.prisma.cafeAdmin.findUnique({
      where: { id: dto.userId },
    });

    if (cafeAdmin) {
      const isPasswordValid = await bcrypt.compare(dto.oldPassword, cafeAdmin.passwordHash);
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
      const isPasswordValid = await bcrypt.compare(dto.oldPassword, superAdmin.passwordHash);
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

  async registerCafe(dto: RegisterCafeDto) {
    const existingCafeAdmin = await this.prisma.cafeAdmin.findUnique({
      where: { email: dto.email },
    });

    const existingSuperAdmin = await this.prisma.superAdmin.findUnique({
      where: { email: dto.email },
    });

    if (existingCafeAdmin || existingSuperAdmin) {
      throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const result = await this.prisma.$transaction(async (prisma) => {
      const cafe = await prisma.cafe.create({
        data: {
          name: dto.cafeName,
          phone: dto.phone,
          status: 'PENDING',
        },
      });

      const admin = await prisma.cafeAdmin.create({
        data: {
          cafeId: cafe.id,
          name: dto.fullName,
          email: dto.email,
          passwordHash: passwordHash,
          isApproved: false,
        },
      });

      return { cafe, admin };
    });

    return {
      message: 'Başvurunuz alındı. Onaylandıktan sonra giriş yapabilirsiniz.',
      cafeId: result.cafe.id,
    };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    let user: any = await this.prisma.cafeAdmin.findUnique({
      where: { email: dto.email },
      include: { cafe: true },
    });
    let role = 'CAFE_ADMIN';

    if (!user) {
      user = await this.prisma.superAdmin.findUnique({
        where: { email: dto.email },
      });
      role = 'SUPER_ADMIN';
    }

    if (!user) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    if (role === 'CAFE_ADMIN') {
      if (!user.isApproved) {
        throw new UnauthorizedException('Hesabınız henüz onaylanmamış.');
      }
      if (!user.isActive || !user.cafe.isActive) {
        throw new UnauthorizedException('Hesabınız veya işletmeniz pasif durumda.');
      }
    }

    // 2FA Check
    if (role === 'CAFE_ADMIN' && user.isTwoFactorEnabled) {
      if (!dto.twoFactorCode) {
        // Return special response indicating 2FA is required
        throw new UnauthorizedException({
            message: '2FA_REQUIRED',
            code: '2FA_REQUIRED'
        });
      }

      const verifyResult = await verify({
        token: dto.twoFactorCode,
        secret: user.twoFactorSecret,
      });

      if (!verifyResult.valid) {
        throw new UnauthorizedException('Geçersiz 2FA kodu.');
      }
    }


    // Create Session (only for CafeAdmin for now as schema supports it)
    let sessionId: string | undefined;
    if (role === 'CAFE_ADMIN') {
        const session = await this.prisma.adminSession.create({
            data: {
                adminId: user.id,
                device: userAgent || 'Unknown',
                ip: ip || 'Unknown',
                token: randomBytes(32).toString('hex'),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            }
        });
        sessionId = session.id;
    }

    // Generate Token
    const payload = { 
        sub: user.id, 
        email: user.email, 
        role,
        sessionId,
        cafeId: role === 'CAFE_ADMIN' ? user.cafeId : undefined 
    };

    const token = this.jwtService.sign(payload);

    // Update session with token signature/hash if needed, but for now we rely on sessionId in payload
    // If we want to support "Revoke specific token", we might store the signature.
    // Since we store sessionId in payload and check DB for session existence, that's enough for "Revoke Session".

    return {
      message: 'Giriş başarılı',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        cafeId: role === 'CAFE_ADMIN' ? user.cafeId : undefined,
        isTwoFactorEnabled: role === 'CAFE_ADMIN' ? user.isTwoFactorEnabled : false,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const admin = await this.prisma.cafeAdmin.findUnique({
      where: { email: dto.email },
    });

    if (!admin) {
      throw new NotFoundException('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.');
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

    if (!admin || admin.resetCode !== dto.code || !admin.resetCodeExpires || admin.resetCodeExpires < new Date()) {
      throw new BadRequestException('Geçersiz veya süresi dolmuş kod.');
    }

    return { message: 'Kod doğrulandı.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const admin = await this.prisma.cafeAdmin.findUnique({
      where: { email: dto.email },
    });

    if (!admin || admin.resetCode !== dto.code || !admin.resetCodeExpires || admin.resetCodeExpires < new Date()) {
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

    return { message: 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.' };
  }

  async getProfile(userId: string) {
    const cafeAdmin = await this.prisma.cafeAdmin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isTwoFactorEnabled: true,
      }
    });

    if (cafeAdmin) {
      return { ...cafeAdmin, role: 'CAFE_ADMIN' };
    }

    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      }
    });

    if (superAdmin) {
      return { ...superAdmin, role: 'SUPER_ADMIN', isTwoFactorEnabled: false };
    }

    throw new NotFoundException('Kullanıcı bulunamadı.');
  }

  // --- 2FA Methods ---

  async generate2FASecret(userId: string) {
    const user = await this.prisma.cafeAdmin.findUnique({ where: { id: userId } });
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
        data: { twoFactorSecret: secret } // Not enabled yet
    });

    const qrCodeUrl = await toDataURL(otpauthUrl);

    return { secret, qrCodeUrl };
  }

  async enable2FA(userId: string, code: string) {
    const user = await this.prisma.cafeAdmin.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) throw new BadRequestException('2FA kurulumu başlatılmamış.');

    const verifyResult = await verify({
        token: code,
        secret: user.twoFactorSecret
    });

    if (!verifyResult.valid) throw new BadRequestException('Geçersiz kod.');

    await this.prisma.cafeAdmin.update({
        where: { id: userId },
        data: { isTwoFactorEnabled: true }
    });

    return { message: '2FA başarıyla etkinleştirildi.' };
  }

  async disable2FA(userId: string) {
    await this.prisma.cafeAdmin.update({
        where: { id: userId },
        data: { 
            isTwoFactorEnabled: false,
            twoFactorSecret: null 
        }
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
            createdAt: true
        }
    });
  }

  async terminateSession(userId: string, sessionId: string) {
    const session = await this.prisma.adminSession.findUnique({ where: { id: sessionId } });
    if (!session || session.adminId !== userId) throw new NotFoundException('Oturum bulunamadı.');

    await this.prisma.adminSession.delete({ where: { id: sessionId } });
    return { message: 'Oturum sonlandırıldı.' };
  }

  async terminateAllOtherSessions(userId: string, currentSessionId?: string) {
    const whereClause: any = { adminId: userId };
    if (currentSessionId) {
        whereClause.id = { not: currentSessionId };
    }

    await this.prisma.adminSession.deleteMany({
        where: whereClause
    });
    return { message: 'Diğer tüm oturumlar sonlandırıldı.' };
  }
}
