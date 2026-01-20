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
let AuthService = class AuthService {
    prisma;
    mailService;
    constructor(prisma, mailService) {
        this.prisma = prisma;
        this.mailService = mailService;
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
    async login(dto) {
        const cafeAdmin = await this.prisma.cafeAdmin.findUnique({
            where: { email: dto.email },
            include: { cafe: true },
        });
        if (cafeAdmin) {
            const isPasswordValid = await bcrypt.compare(dto.password, cafeAdmin.passwordHash);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('E-posta veya şifre hatalı.');
            }
            if (!cafeAdmin.isApproved) {
                throw new common_1.UnauthorizedException('Hesabınız henüz onaylanmamış. Lütfen yönetici onayını bekleyin.');
            }
            if (!cafeAdmin.isActive || !cafeAdmin.cafe.isActive) {
                throw new common_1.UnauthorizedException('Hesabınız veya işletmeniz pasif durumda.');
            }
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
        const superAdmin = await this.prisma.superAdmin.findUnique({
            where: { email: dto.email },
        });
        if (superAdmin) {
            const isPasswordValid = await bcrypt.compare(dto.password, superAdmin.passwordHash);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('E-posta veya şifre hatalı.');
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
        throw new common_1.UnauthorizedException('E-posta veya şifre hatalı.');
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map