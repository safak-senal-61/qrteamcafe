import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterCafeDto } from './dto/register-cafe.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async registerCafe(dto: RegisterCafeDto) {
    // Check if email already exists in CafeAdmin
    const existingCafeAdmin = await this.prisma.cafeAdmin.findUnique({
      where: { email: dto.email },
    });

    // Check if email already exists in SuperAdmin
    const existingSuperAdmin = await this.prisma.superAdmin.findUnique({
      where: { email: dto.email },
    });

    if (existingCafeAdmin || existingSuperAdmin) {
      throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create Cafe and Admin in transaction
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

  async login(dto: LoginDto) {
    // 1. Try to find user in CafeAdmin
    const cafeAdmin = await this.prisma.cafeAdmin.findUnique({
      where: { email: dto.email },
      include: { cafe: true },
    });

    if (cafeAdmin) {
      // Check password
      const isPasswordValid = await bcrypt.compare(
        dto.password,
        cafeAdmin.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('E-posta veya şifre hatalı.');
      }

      // Check approval status
      if (!cafeAdmin.isApproved) {
        throw new UnauthorizedException(
          'Hesabınız henüz onaylanmamış. Lütfen yönetici onayını bekleyin.',
        );
      }

      if (!cafeAdmin.isActive || !cafeAdmin.cafe.isActive) {
        throw new UnauthorizedException(
          'Hesabınız veya işletmeniz pasif durumda.',
        );
      }

      // TODO: Generate JWT token here
      return {
        message: 'Giriş başarılı',
        user: {
          id: cafeAdmin.id,
          name: cafeAdmin.name,
          email: cafeAdmin.email,
          role: 'CAFE_ADMIN',
          cafeId: cafeAdmin.cafeId,
        },
      };
    }

    // 2. If not found in CafeAdmin, try SuperAdmin
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { email: dto.email },
    });

    if (superAdmin) {
      const isPasswordValid = await bcrypt.compare(
        dto.password,
        superAdmin.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('E-posta veya şifre hatalı.');
      }

      return {
        message: 'Giriş başarılı',
        user: {
          id: superAdmin.id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: 'SUPER_ADMIN',
        },
      };
    }

    throw new UnauthorizedException('E-posta veya şifre hatalı.');
  }
}
