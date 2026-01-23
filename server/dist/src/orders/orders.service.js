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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const events_gateway_1 = require("../events/events.gateway");
const product_images_util_1 = require("../products/product-images.util");
let OrdersService = class OrdersService {
    prisma;
    eventsGateway;
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
    }
    mapOrderWithImages(order) {
        if (!order)
            return order;
        return {
            ...order,
            items: order.items.map((item) => ({
                ...item,
                product: item.product ? {
                    ...item.product,
                    imageUrl: (0, product_images_util_1.getProductImage)(item.product.name, item.product.category?.name, item.product.imageUrl)
                } : null
            }))
        };
    }
    async create(cafeId, createOrderDto) {
        return this.prisma.$transaction(async (prisma) => {
            if (createOrderDto.tableId) {
                const table = await prisma.table.findUnique({
                    where: { id: createOrderDto.tableId },
                });
                if (table && !table.isOccupied) {
                    await prisma.table.update({
                        where: { id: createOrderDto.tableId },
                        data: {
                            isOccupied: true,
                            lastOccupiedAt: new Date(),
                        },
                    });
                }
            }
            for (const item of createOrderDto.items) {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                });
                if (!product) {
                    throw new common_1.BadRequestException(`Ürün bulunamadı: ${item.productId}`);
                }
                if ((product.stock || 0) < item.quantity) {
                    throw new common_1.BadRequestException(`${product.name} için yeterli stok yok. Mevcut: ${product.stock}`);
                }
                await prisma.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
            }
            const totalAmount = createOrderDto.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
            const order = await prisma.order.create({
                data: {
                    cafeId,
                    tableId: createOrderDto.tableId,
                    customerId: createOrderDto.customerId,
                    totalAmount: totalAmount,
                    status: 'PENDING',
                    items: {
                        create: createOrderDto.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.unitPrice * item.quantity,
                            note: item.note,
                        })),
                    },
                },
                include: {
                    table: true,
                    items: {
                        include: {
                            product: {
                                include: { category: true }
                            },
                        },
                    },
                },
            });
            const orderWithImages = this.mapOrderWithImages(order);
            this.eventsGateway.notifyNewOrder(cafeId, orderWithImages);
            return orderWithImages;
        });
    }
    async findAllByCustomer(customerId) {
        const orders = await this.prisma.order.findMany({
            where: { customerId },
            include: {
                table: true,
                reviews: true,
                items: {
                    include: {
                        product: {
                            include: { category: true }
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return orders.map(order => this.mapOrderWithImages(order));
    }
    async findAll(cafeId) {
        const orders = await this.prisma.order.findMany({
            where: { cafeId },
            include: {
                table: true,
                reviews: true,
                items: {
                    include: {
                        product: {
                            include: { category: true }
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return orders.map(order => this.mapOrderWithImages(order));
    }
    async updateStatus(id, status) {
        return this.prisma.$transaction(async (prisma) => {
            const order = await prisma.order.findUnique({
                where: { id },
                include: { items: { include: { product: true } } },
            });
            if (!order)
                throw new Error('Sipariş bulunamadı');
            if (status === 'CANCELLED' && order.status !== 'PENDING') {
                throw new common_1.BadRequestException('Sadece onay bekleyen siparişler iptal edilebilir.');
            }
            if (status === 'CANCELLED') {
                for (const item of order.items) {
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } },
                    });
                }
            }
            const updateData = { status };
            if (status === 'DELIVERED' && !order.deliveredAt) {
                updateData.deliveredAt = new Date();
            }
            const updatedOrder = await prisma.order.update({
                where: { id },
                data: updateData,
                include: {
                    table: true,
                    items: {
                        include: {
                            product: {
                                include: { category: true }
                            }
                        }
                    }
                },
            });
            const updatedOrderWithImages = this.mapOrderWithImages(updatedOrder);
            this.eventsGateway.notifyOrderStatusUpdate(updatedOrderWithImages.cafeId, updatedOrderWithImages);
            return updatedOrderWithImages;
        });
    }
    async closeTable(tableId) {
        const orders = await this.prisma.order.findMany({
            where: {
                tableId,
                status: { not: 'PAID' },
            },
        });
        if (orders.length === 0) {
            throw new Error('Bu masada açık sipariş yok.');
        }
        await this.prisma.order.updateMany({
            where: {
                tableId,
                status: { not: 'PAID' },
            },
            data: {
                status: 'PAID',
            },
        });
        await this.prisma.table.update({
            where: { id: tableId },
            data: { isOccupied: false },
        });
        const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        return { message: 'Hesap kapatıldı', totalAmount };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway])
], OrdersService);
//# sourceMappingURL=orders.service.js.map