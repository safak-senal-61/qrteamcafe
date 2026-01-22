import { PrismaService } from '../prisma/prisma.service';
import { RegisterCafeDto } from './dto/register-cafe.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from './mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtService } from '@nestjs/jwt';
import { RegisterCustomerDto } from './dto/register-customer.dto';
export declare class AuthService {
    private prisma;
    private mailService;
    private jwtService;
    constructor(prisma: PrismaService, mailService: MailService, jwtService: JwtService);
    registerCustomer(dto: RegisterCustomerDto): Promise<{
        message: string;
        requiresVerification: boolean;
        email: string;
    }>;
    verifyCustomer(dto: VerifyCodeDto): Promise<{
        token: string;
        customer: {
            id: string;
            email: string;
            name: string | null;
            phone: string | null;
        };
    }>;
    loginCustomer(dto: LoginDto): Promise<{
        token: string;
        customer: {
            id: string;
            email: string;
            name: string | null;
            phone: string | null;
        };
    }>;
    changePassword(dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    registerCafe(dto: RegisterCafeDto): Promise<{
        message: string;
        cafeId: string;
    }>;
    login(dto: LoginDto, ip?: string, userAgent?: string): Promise<{
        message: string;
        token: string;
        user: {
            id: any;
            name: any;
            email: any;
            role: string;
            cafeId: any;
            isTwoFactorEnabled: any;
        };
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    verifyResetCode(dto: VerifyCodeDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    forgotPasswordCustomer(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    verifyResetCodeCustomer(dto: VerifyCodeDto): Promise<{
        message: string;
    }>;
    resetPasswordCustomer(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    getProfile(userId: string): Promise<{
        role: string;
        id: string;
        name: string;
        email: string;
        isTwoFactorEnabled: boolean;
    } | {
        role: string;
        isTwoFactorEnabled: boolean;
        id: string;
        email: string;
    }>;
    generate2FASecret(userId: string): Promise<{
        secret: string;
        qrCodeUrl: string;
    }>;
    enable2FA(userId: string, code: string): Promise<{
        message: string;
    }>;
    disable2FA(userId: string): Promise<{
        message: string;
    }>;
    getSessions(userId: string): Promise<{
        id: string;
        createdAt: Date;
        device: string | null;
        ip: string | null;
        lastActive: Date;
    }[]>;
    terminateSession(userId: string, sessionId: string): Promise<{
        message: string;
    }>;
    terminateAllOtherSessions(userId: string, currentSessionId?: string): Promise<{
        message: string;
    }>;
}
