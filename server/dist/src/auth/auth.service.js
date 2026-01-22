"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
const mail_service_1 = require("./mail.service");
const jwt_1 = require("@nestjs/jwt");
const otplib_1 = require("otplib");
const qrcode_1 = require("qrcode");
const crypto_1 = require("crypto");
let AuthService = class AuthService {
    prisma;
    mailService;
    jwtService;
    constructor(prisma, mailService, jwtService) {
        this.prisma = prisma;
        this.mailService = mailService;
        this.jwtService = jwtService;
    }
    async registerCustomer(dto) {
        const existingCustomer = await this.prisma.customer.findUnique({
            where: { email: dto.email },
        });
        if (existingCustomer) {
            throw new common_1.BadRequestException('Bu e-posta adresi zaten kullanımda.');
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(dto.password, salt);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
        const customer = await this.prisma.customer.create({
            data: {
                email: dto.email,
                passwordHash,
                name: dto.name,
                phone: dto.phone,
                isVerified: false,
                verificationCode,
                verificationCodeExpires,
            },
        });
        if (customer.email) {
            await this.mailService.sendVerificationEmail(customer.email, verificationCode);
        }
        return {
            message: 'Kayıt başarılı. Lütfen e-posta adresinize gönderilen doğrulama kodunu giriniz.',
            requiresVerification: true,
            email: customer.email,
        };
    }
    async verifyCustomer(dto) {
        const customer = await this.prisma.customer.findUnique({
            where: { email: dto.email },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Kullanıcı bulunamadı.');
        }
        if (customer.isVerified) {
            throw new common_1.BadRequestException('Hesap zaten doğrulanmış.');
        }
        if (customer.verificationCode !== dto.code ||
            !customer.verificationCodeExpires ||
            customer.verificationCodeExpires < new Date()) {
            throw new common_1.BadRequestException('Geçersiz veya süresi dolmuş doğrulama kodu.');
        }
        const updatedCustomer = await this.prisma.customer.update({
            where: { id: customer.id },
            data: {
                isVerified: true,
                verificationCode: null,
                verificationCodeExpires: null,
            },
        });
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
            },
        };
    }
    async loginCustomer(dto) {
        const customer = await this.prisma.customer.findUnique({
            where: { email: dto.email },
        });
        if (!customer) {
            throw new common_1.UnauthorizedException('E-posta veya şifre hatalı.');
        }
        if (!customer.passwordHash) {
            throw new common_1.UnauthorizedException('E-posta veya şifre hatalı.');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, customer.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('E-posta veya şifre hatalı.');
        }
        if (!customer.isVerified) {
            throw new common_1.UnauthorizedException({
                message: 'Hesabınız henüz doğrulanmamış.',
                code: 'NOT_VERIFIED',
                email: customer.email
            });
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
            },
        };
    }
    async changePassword(dto) {
        const cafeAdmin = await this.prisma.cafeAdmin.findUnique({
            where: { id: dto.userId },
        });
        if (cafeAdmin) {
            const isPasswordValid = await bcrypt.compare(dto.oldPassword, cafeAdmin.passwordHash);
            if (!isPasswordValid) {
                throw new common_1.BadRequestException('Mevcut şifre hatalı.');
            }
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(dto.newPassword, salt);
            await this.prisma.cafeAdmin.update({
                where: { id: cafeAdmin.id },
                data: { passwordHash },
            });
            return { message: 'Şifreniz başarıyla güncellendi.' };
        }
        const superAdmin = await this.prisma.superAdmin.findUnique({
            where: { id: dto.userId },
        });
        if (superAdmin) {
            const isPasswordValid = await bcrypt.compare(dto.oldPassword, superAdmin.passwordHash);
            if (!isPasswordValid) {
                throw new common_1.BadRequestException('Mevcut şifre hatalı.');
            }
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(dto.newPassword, salt);
            await this.prisma.superAdmin.update({
                where: { id: superAdmin.id },
                data: { passwordHash },
            });
            return { message: 'Şifreniz başarıyla güncellendi.' };
        }
        throw new common_1.NotFoundException('Kullanıcı bulunamadı.');
    }
    async registerCafe(dto) {
        const existingCafeAdmin = await this.prisma.cafeAdmin.findUnique({
            where: { email: dto.email },
        });
        const existingSuperAdmin = await this.prisma.superAdmin.findUnique({
            where: { email: dto.email },
        });
        if (existingCafeAdmin || existingSuperAdmin) {
            throw new common_1.BadRequestException('Bu e-posta adresi zaten kullanımda.');
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
    async login(dto, ip, userAgent) {
        let user = await this.prisma.cafeAdmin.findUnique({
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
            throw new common_1.UnauthorizedException('E-posta veya şifre hatalı.');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('E-posta veya şifre hatalı.');
        }
        if (role === 'CAFE_ADMIN') {
            if (!user.isApproved) {
                throw new common_1.UnauthorizedException('Hesabınız henüz onaylanmamış.');
            }
            if (!user.isActive || !user.cafe.isActive) {
                throw new common_1.UnauthorizedException('Hesabınız veya işletmeniz pasif durumda.');
            }
        }
        if (role === 'CAFE_ADMIN' && user.isTwoFactorEnabled) {
            if (!dto.twoFactorCode) {
                throw new common_1.UnauthorizedException({
                    message: '2FA_REQUIRED',
                    code: '2FA_REQUIRED'
                });
            }
            const verifyResult = await (0, otplib_1.verify)({
                token: dto.twoFactorCode,
                secret: user.twoFactorSecret,
            });
            if (!verifyResult.valid) {
                throw new common_1.UnauthorizedException('Geçersiz 2FA kodu.');
            }
        }
        let sessionId;
        if (role === 'CAFE_ADMIN') {
            const session = await this.prisma.adminSession.create({
                data: {
                    adminId: user.id,
                    device: userAgent || 'Unknown',
                    ip: ip || 'Unknown',
                    token: (0, crypto_1.randomBytes)(32).toString('hex'),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                }
            });
            sessionId = session.id;
        }
        const payload = {
            sub: user.id,
            email: user.email,
            role,
            sessionId,
            cafeId: role === 'CAFE_ADMIN' ? user.cafeId : undefined
        };
        const token = this.jwtService.sign(payload);
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
    async forgotPassword(dto) {
        const admin = await this.prisma.cafeAdmin.findUnique({
            where: { email: dto.email },
        });
        if (!admin) {
            throw new common_1.NotFoundException('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.');
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
    async verifyResetCode(dto) {
        const admin = await this.prisma.cafeAdmin.findUnique({
            where: { email: dto.email },
        });
        if (!admin || admin.resetCode !== dto.code || !admin.resetCodeExpires || admin.resetCodeExpires < new Date()) {
            throw new common_1.BadRequestException('Geçersiz veya süresi dolmuş kod.');
        }
        return { message: 'Kod doğrulandı.' };
    }
    async resetPassword(dto) {
        const admin = await this.prisma.cafeAdmin.findUnique({
            where: { email: dto.email },
        });
        if (!admin || admin.resetCode !== dto.code || !admin.resetCodeExpires || admin.resetCodeExpires < new Date()) {
            throw new common_1.BadRequestException('Geçersiz veya süresi dolmuş kod.');
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
    async forgotPasswordCustomer(dto) {
        const customer = await this.prisma.customer.findUnique({
            where: { email: dto.email },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.');
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 15 * 60 * 1000);
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
    async verifyResetCodeCustomer(dto) {
        const customer = await this.prisma.customer.findUnique({
            where: { email: dto.email },
        });
        if (!customer || customer.resetCode !== dto.code || !customer.resetCodeExpires || customer.resetCodeExpires < new Date()) {
            throw new common_1.BadRequestException('Geçersiz veya süresi dolmuş kod.');
        }
        return { message: 'Kod doğrulandı.' };
    }
    async resetPasswordCustomer(dto) {
        const customer = await this.prisma.customer.findUnique({
            where: { email: dto.email },
        });
        if (!customer || customer.resetCode !== dto.code || !customer.resetCodeExpires || customer.resetCodeExpires < new Date()) {
            throw new common_1.BadRequestException('Geçersiz veya süresi dolmuş kod.');
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
        return { message: 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.' };
    }
    async getProfile(userId) {
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
        throw new common_1.NotFoundException('Kullanıcı bulunamadı.');
    }
    async generate2FASecret(userId) {
        const user = await this.prisma.cafeAdmin.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Kullanıcı bulunamadı.');
        const secret = (0, otplib_1.generateSecret)();
        const otpauthUrl = (0, otplib_1.generateURI)({
            secret,
            issuer: 'QR Team Cafe',
            label: user.email,
        });
        await this.prisma.cafeAdmin.update({
            where: { id: userId },
            data: { twoFactorSecret: secret }
        });
        const qrCodeUrl = await (0, qrcode_1.toDataURL)(otpauthUrl);
        return { secret, qrCodeUrl };
    }
    async enable2FA(userId, code) {
        const user = await this.prisma.cafeAdmin.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorSecret)
            throw new common_1.BadRequestException('2FA kurulumu başlatılmamış.');
        const verifyResult = await (0, otplib_1.verify)({
            token: code,
            secret: user.twoFactorSecret
        });
        if (!verifyResult.valid)
            throw new common_1.BadRequestException('Geçersiz kod.');
        await this.prisma.cafeAdmin.update({
            where: { id: userId },
            data: { isTwoFactorEnabled: true }
        });
        return { message: '2FA başarıyla etkinleştirildi.' };
    }
    async disable2FA(userId) {
        await this.prisma.cafeAdmin.update({
            where: { id: userId },
            data: {
                isTwoFactorEnabled: false,
                twoFactorSecret: null
            }
        });
        return { message: '2FA devre dışı bırakıldı.' };
    }
    async getSessions(userId) {
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
    async terminateSession(userId, sessionId) {
        const session = await this.prisma.adminSession.findUnique({ where: { id: sessionId } });
        if (!session || session.adminId !== userId)
            throw new common_1.NotFoundException('Oturum bulunamadı.');
        await this.prisma.adminSession.delete({ where: { id: sessionId } });
        return { message: 'Oturum sonlandırıldı.' };
    }
    async terminateAllOtherSessions(userId, currentSessionId) {
        const whereClause = { adminId: userId };
        if (currentSessionId) {
            whereClause.id = { not: currentSessionId };
        }
        await this.prisma.adminSession.deleteMany({
            where: whereClause
        });
        return { message: 'Diğer tüm oturumlar sonlandırıldı.' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map