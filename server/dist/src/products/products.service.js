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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(cafeId, createProductDto) {
        return this.prisma.product.create({
            data: {
                ...createProductDto,
                cafeId,
            },
        });
    }
    async findAll(cafeId) {
        return this.prisma.product.findMany({
            where: { cafeId },
            include: {
                category: true,
            },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async reorder(items) {
        return this.prisma.$transaction(items.map((item) => this.prisma.product.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
        })));
    }
    async findOne(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { category: true },
        });
        if (!product)
            throw new common_1.NotFoundException('Ürün bulunamadı');
        return product;
    }
    async update(id, updateProductDto) {
        await this.findOne(id);
        return this.prisma.product.update({
            where: { id },
            data: updateProductDto,
        });
    }
    async updateStock(id, quantity) {
        await this.findOne(id);
        return this.prisma.product.update({
            where: { id },
            data: {
                stock: {
                    increment: quantity
                }
            }
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.product.delete({
            where: { id },
        });
    }
    async getRecommendations(productId, limit = 3) {
        const ordersWithProduct = await this.prisma.orderItem.findMany({
            where: { productId },
            select: { orderId: true },
            distinct: ['orderId'],
            take: 50
        });
        const orderIds = ordersWithProduct.map(o => o.orderId);
        if (orderIds.length === 0)
            return [];
        const relatedItems = await this.prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
                orderId: { in: orderIds },
                productId: { not: productId }
            },
            _count: {
                productId: true
            },
            orderBy: {
                _count: {
                    productId: 'desc'
                }
            },
            take: limit
        });
        const recommendedProductIds = relatedItems.map(item => item.productId);
        return this.prisma.product.findMany({
            where: { id: { in: recommendedProductIds }, isAvailable: true }
        });
    }
    async toggleChefRecommendation(id, isChefRecommended) {
        await this.findOne(id);
        return this.prisma.product.update({
            where: { id },
            data: { isChefRecommended }
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map