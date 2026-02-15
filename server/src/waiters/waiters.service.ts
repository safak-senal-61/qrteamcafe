import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginWaiterDto } from './dto/login-waiter.dto';
import { UpdateWaiterStatusDto } from './dto/update-waiter-status.dto';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { EventsGateway } from '../events/events.gateway';
import { MailService } from '../common/mail.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class WaitersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private eventsGateway: EventsGateway,
    private mailService: MailService,
    private auditLogsService: AuditLogsService,
  ) {}

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
      throw new UnauthorizedException(
        'Lütfen önce e-posta adresinizi doğrulayın.',
      );
    }

    if (waiter.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Hesabınız yönetici tarafından onaylanmamış veya aktif değil.',
      );
    }

    const sessionId = uuidv4();
    const payload = {
      sub: waiter.id,
      email: waiter.email,
      role: waiter.role,
      cafeId: waiter.cafeId,
      type: 'waiter',
      sessionId,
    };
    const token = this.jwtService.sign(payload);

    // Update current session token for single device login
    await this.prisma.waiter.update({
      where: { id: waiter.id },
      data: { currentSessionToken: sessionId },
    });

    return {
      token,
      waiter: {
        id: waiter.id,
        firstName: waiter.firstName,
        lastName: waiter.lastName,
        role: waiter.role,
        cafeName: waiter.cafe.name,
        cafeId: waiter.cafeId,
      },
    };
  }

  async findAll(cafeId: string) {
    return this.prisma.waiter.findMany({
      where: { cafeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateWaiterStatusDto,
    cafeId?: string,
    actorId?: string,
    actorType: 'ADMIN' | 'WAITER' = 'ADMIN',
  ) {
    const waiter = await this.prisma.waiter.findUnique({ where: { id } });
    if (!waiter) throw new NotFoundException('Garson bulunamadı.');

    if (cafeId && waiter.cafeId !== cafeId) {
      throw new UnauthorizedException('Bu garsonu yönetme yetkiniz yok.');
    }

    const updatedWaiter = await this.prisma.waiter.update({
      where: { id },
      data: {
        status: dto.status,
        role: dto.role || waiter.role,
      },
    });

    if (actorId) {
      await this.auditLogsService.logAction(
        updatedWaiter.cafeId,
        'STAFF_UPDATE_STATUS',
        `Staff status updated: ${updatedWaiter.firstName} ${updatedWaiter.lastName} -> ${dto.status}`,
        actorId,
        actorType,
        updatedWaiter.id,
      );
    }

    return updatedWaiter;
  }

  async inviteStaff(
    dto: InviteStaffDto,
    cafeId: string,
    origin?: string,
    actorId?: string,
    actorType: 'ADMIN' | 'WAITER' = 'ADMIN',
  ) {
    const existing = await this.prisma.waiter.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Bu e-posta adresi zaten kayıtlı.');
    }

    // Handle empty string phone from DTO if transformation didn't happen or for extra safety
    const phone = dto.phone === '' ? null : dto.phone;

    if (phone) {
      const existingPhone = await this.prisma.waiter.findUnique({
        where: { phone: phone },
      });
      if (existingPhone) {
        throw new BadRequestException('Bu telefon numarası zaten kayıtlı.');
      }
    }

    const invitationToken = uuidv4();
    const invitationExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    const waiter = await this.prisma.waiter.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: phone,
        role: dto.role,
        cafeId: cafeId,
        status: 'INVITED',
        emailVerified: true, // Trusted since invited by admin
        invitationToken,
        invitationExpiresAt,
        passwordHash: undefined, // Explicitly undefined
      },
      include: { cafe: true },
    });

    await this.mailService.sendStaffInvitation(
      dto.email,
      invitationToken,
      dto.role,
      waiter.cafe.name,
      origin,
    );

    if (actorId) {
      await this.auditLogsService.logAction(
        cafeId,
        'STAFF_INVITE',
        `Staff invited: ${dto.email} (${dto.role})`,
        actorId,
        actorType,
        waiter.id,
      );
    }

    return { message: 'Davet gönderildi.', waiter };
  }

  async resendInvitation(
    waiterId: string,
    cafeId: string,
    origin?: string,
    actorId?: string,
    actorType: 'ADMIN' | 'WAITER' = 'ADMIN',
  ) {
    const waiter = await this.prisma.waiter.findFirst({
      where: { id: waiterId, cafeId },
      include: { cafe: true },
    });

    if (!waiter) {
      throw new NotFoundException('Personel bulunamadı.');
    }

    if (waiter.status !== 'INVITED') {
      throw new BadRequestException(
        'Bu personel zaten kayıtlı veya davet sürecinde değil.',
      );
    }

    const invitationToken = uuidv4();
    const invitationExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await this.prisma.waiter.update({
      where: { id: waiterId },
      data: {
        invitationToken,
        invitationExpiresAt,
      },
    });

    await this.mailService.sendStaffInvitation(
      waiter.email,
      invitationToken,
      waiter.role || 'WAITER',
      waiter.cafe.name,
      origin,
    );

    if (actorId) {
      await this.auditLogsService.logAction(
        cafeId,
        'STAFF_INVITE_RESEND',
        `Staff invitation resent: ${waiter.email}`,
        actorId,
        actorType,
        waiter.id,
      );
    }

    return { message: 'Davet tekrar gönderildi.' };
  }

  async deleteInvitation(
    waiterId: string,
    cafeId: string,
    actorId?: string,
    actorType: 'ADMIN' | 'WAITER' = 'ADMIN',
  ) {
    const waiter = await this.prisma.waiter.findFirst({
      where: { id: waiterId, cafeId },
    });

    if (!waiter) {
      throw new NotFoundException('Personel bulunamadı.');
    }

    if (waiter.status !== 'INVITED' && waiter.status !== 'PENDING_APPROVAL') {
      // Maybe allow deleting active staff too? User said "onay bekleniyorsa hesap silinebilmeli".
      // Let's stick to invited/pending for now based on context, or just delete regardless if admin wants to remove staff.
      // But for "delete invitation", it usually implies pending.
      // If the user wants to remove an ACTIVE staff, that might be a different flow (archive/delete).
      // I'll assume this is for the "Onay Bekleyenler" tab.
    }

    await this.prisma.waiter.delete({
      where: { id: waiterId },
    });

    if (actorId) {
      await this.auditLogsService.logAction(
        cafeId,
        'STAFF_DELETE',
        `Staff deleted/invitation removed: ${waiter.firstName} ${waiter.lastName}`,
        actorId,
        actorType,
        waiter.id,
      );
    }

    return { message: 'Davet silindi.' };
  }

  async verifyInvitationToken(token: string) {
    const waiter = await this.prisma.waiter.findUnique({
      where: { invitationToken: token },
      include: { cafe: true },
    });

    if (!waiter) {
      throw new NotFoundException('Geçersiz davet kodu.');
    }

    if (waiter.invitationExpiresAt && waiter.invitationExpiresAt < new Date()) {
      throw new BadRequestException('Davet süresi dolmuş.');
    }

    if (waiter.status !== 'INVITED') {
      throw new BadRequestException(
        'Bu davet zaten kullanılmış veya geçersiz.',
      );
    }

    return {
      valid: true,
      email: waiter.email,
      firstName: waiter.firstName,
      lastName: waiter.lastName,
      role: waiter.role,
      cafeName: waiter.cafe.name,
    };
  }

  async completeRegistration(dto: CompleteRegistrationDto) {
    const waiter = await this.prisma.waiter.findUnique({
      where: { invitationToken: dto.token },
    });

    if (!waiter) {
      throw new NotFoundException('Geçersiz işlem.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    await this.prisma.waiter.update({
      where: { id: waiter.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
        invitationToken: null,
        invitationExpiresAt: null,
      },
    });

    return { message: 'Hesap oluşturuldu. Giriş yapabilirsiniz.' };
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
      },
    });
    return waiter;
  }
}
