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
exports.SuperAdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
const config_1 = require("@nestjs/config");
let SuperAdminService = class SuperAdminService {
    prisma;
    configService;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async register(dto) {
        const registerKey = this.configService.get('SUPER_ADMIN_REGISTER_KEY');
        if (dto.registerKey !== registerKey) {
            throw new common_1.UnauthorizedException('Geçersiz kayıt anahtarı.');
        }
        const existingSuperAdmin = await this.prisma.superAdmin.findUnique({
            where: { email: dto.email },
        });
        const existingCafeAdmin = await this.prisma.cafeAdmin.findUnique({
            where: { email: dto.email },
        });
        if (existingSuperAdmin || existingCafeAdmin) {
            throw new common_1.BadRequestException('Bu e-posta adresi zaten kullanımda.');
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(dto.password, salt);
        await this.prisma.superAdmin.create({
            data: {
                name: dto.name,
                email: dto.email,
                passwordHash,
            },
        });
        return { message: 'Süper admin kaydı başarıyla oluşturuldu.' };
    }
    async getPendingCafes() {
        return this.prisma.cafe.findMany({
            where: {
                status: 'PENDING',
            },
            include: {
                admins: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async getAllCafes() {
        return this.prisma.cafe.findMany({
            include: {
                admins: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async getDashboardStats() {
        const totalCafes = await this.prisma.cafe.count();
        const pendingCafes = await this.prisma.cafe.count({
            where: { status: 'PENDING' },
        });
        const activeCafes = await this.prisma.cafe.count({
            where: { status: 'APPROVED', isActive: true },
        });
        const rejectedCafes = await this.prisma.cafe.count({
            where: { status: 'REJECTED' },
        });
        const totalUsers = await this.prisma.cafeAdmin.count();
        return {
            totalCafes,
            pendingCafes,
            activeCafes,
            rejectedCafes,
            totalUsers,
        };
    }
    async getSettings() {
        const settings = await this.prisma.systemSetting.findMany();
        return settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    }
    async updateSetting(key, value) {
        return this.prisma.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }
    async approveCafe(cafeId) {
        return this.prisma.$transaction(async (prisma) => {
            const cafe = await prisma.cafe.update({
                where: { id: cafeId },
                data: { status: 'APPROVED', isActive: true },
            });
            await prisma.cafeAdmin.updateMany({
                where: { cafeId: cafeId },
                data: { isApproved: true, isActive: true },
            });
            return cafe;
        });
    }
    async rejectCafe(cafeId) {
        return this.prisma.$transaction(async (prisma) => {
            const cafe = await prisma.cafe.update({
                where: { id: cafeId },
                data: { status: 'REJECTED', isActive: false },
            });
            await prisma.cafeAdmin.updateMany({
                where: { cafeId: cafeId },
                data: { isApproved: false, isActive: false },
            });
            return cafe;
        });
    }
};
exports.SuperAdminService = SuperAdminService;
exports.SuperAdminService = SuperAdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], SuperAdminService);
//# sourceMappingURL=super-admin.service.js.map