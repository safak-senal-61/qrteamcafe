"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CafesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CafesService = class CafesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOne(id) {
        const cafe = await this.prisma.cafe.findUnique({
            where: { id },
        });
        if (!cafe)
            throw new common_1.NotFoundException('Cafe bulunamadı');
        return cafe;
    }
    async update(id, data) {
        return this.prisma.cafe.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                type: data.type,
                city: data.city,
                district: data.district,
                address: data.address,
                phone: data.phone,
                email: data.email,
                website: data.website,
                authorizedPerson: data.authorizedPerson,
                serviceType: data.serviceType,
                workingHours: data.workingHours,
                preparationTime: data.preparationTime ? Number(data.preparationTime) : undefined,
                paymentMethods: data.paymentMethods,
                logoUrl: data.logoUrl,
                googleMapsUrl: data.googleMapsUrl,
                showProductRatings: data.showProductRatings,
                coverImageUrl: data.coverImageUrl,
                brandColor: data.brandColor,
                menuViewMode: data.menuViewMode,
                welcomeMessage: data.welcomeMessage,
                instagramUrl: data.instagramUrl,
                facebookUrl: data.facebookUrl,
                twitterUrl: data.twitterUrl,
                wifiSsid: data.wifiSsid,
                wifiPassword: data.wifiPassword,
                waiterCallOptions: data.waiterCallOptions,
                isMaintenanceMode: data.isMaintenanceMode,
                autoApproveReviews: data.autoApproveReviews,
            },
        });
    }
    async getDashboardStats(cafeId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalOrders, dailyRevenue, activeTables, totalProducts] = await Promise.all([
            this.prisma.order.count({ where: { cafeId } }),
            this.prisma.order.aggregate({
                where: {
                    cafeId,
                    createdAt: { gte: today },
                    status: 'PAID',
                },
                _sum: { totalAmount: true },
            }),
            this.prisma.table.count({ where: { cafeId, isOccupied: true } }),
            this.prisma.product.count({ where: { cafeId } }),
        ]);
        const recentOrders = await this.prisma.order.findMany({
            where: { cafeId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                table: true,
                items: {
                    include: { product: true },
                },
            },
        });
        const popularProducts = await this.prisma.product.findMany({
            where: { cafeId },
            take: 5,
            orderBy: {
                orderItems: {
                    _count: 'desc',
                },
            },
        });
        return {
            totalOrders,
            dailyRevenue: dailyRevenue._sum.totalAmount || 0,
            activeTables,
            totalProducts,
            recentOrders,
            popularProducts,
        };
    }
};
exports.CafesService = CafesService;
exports.CafesService = CafesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CafesService);
//# sourceMappingURL=cafes.service.js.map