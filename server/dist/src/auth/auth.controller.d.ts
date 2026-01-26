import { AuthService } from './auth.service';
import { RegisterCafeDto } from './dto/register-cafe.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { Request } from 'express';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import type { RequestWithUser } from './interfaces';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    registerCustomer(dto: RegisterCustomerDto): Promise<{
        message: string;
        requiresVerification: boolean;
        email: string | null;
    }>;
    verifyCustomer(dto: VerifyCodeDto): Promise<{
        token: string;
        customer: {
            id: string;
            email: string | null;
            name: string | null;
            phone: string | null;
            referralCode: any;
        };
    }>;
    loginCustomer(dto: LoginDto): Promise<{
        token: string;
        customer: {
            id: string;
            email: string | null;
            name: string | null;
            phone: string | null;
            referralCode: any;
        };
    }>;
    forgotPasswordCustomer(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    verifyCodeCustomer(dto: VerifyCodeDto): Promise<{
        message: string;
    }>;
    resetPasswordCustomer(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    register(dto: RegisterCafeDto): Promise<{
        message: string;
        cafeId: string;
    }>;
    login(dto: LoginDto, req: Request): Promise<{
        message: string;
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            cafeId: string | undefined;
            isTwoFactorEnabled: boolean;
        };
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    verifyCode(dto: VerifyCodeDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    getProfile(req: RequestWithUser): Promise<{
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
    generate2FA(req: RequestWithUser): Promise<{
        secret: string;
        qrCodeUrl: string;
    }>;
    enable2FA(req: RequestWithUser, code: string): Promise<{
        message: string;
    }>;
    disable2FA(req: RequestWithUser): Promise<{
        message: string;
    }>;
    getSessions(req: RequestWithUser): Promise<{
        id: string;
        createdAt: Date;
        device: string | null;
        ip: string | null;
        lastActive: Date;
    }[]>;
    terminateSession(req: RequestWithUser, sessionId: string): Promise<{
        message: string;
    }>;
    terminateAllOtherSessions(req: RequestWithUser): Promise<{
        message: string;
    }>;
}
