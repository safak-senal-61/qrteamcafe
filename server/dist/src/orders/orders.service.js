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
let OrdersService = class OrdersService {
    prisma;
    eventsGateway;
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
    }
    async create(cafeId, createOrderDto) {
        if (createOrderDto.tableId) {
            const table = await this.prisma.table.findUnique({
                where: { id: createOrderDto.tableId },
            });
            if (table && !table.isOccupied) {
                await this.prisma.table.update({
                    where: { id: createOrderDto.tableId },
                    data: {
                        isOccupied: true,
                        lastOccupiedAt: new Date(),
                    },
                });
            }
        }
        const order = await this.prisma.order.create({
            data: {
                cafeId,
                tableId: createOrderDto.tableId,
                totalAmount: createOrderDto.totalAmount,
                status: 'PENDING',
                items: {
                    create: createOrderDto.items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        totalPrice: item.price * item.quantity,
                    })),
                },
            },
            include: {
                table: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        this.eventsGateway.notifyNewOrder(cafeId, order);
        return order;
    }
    findAll(cafeId) {
        return this.prisma.order.findMany({
            where: { cafeId },
            include: {
                table: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
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
            if (order.status === 'PENDING' && status === 'PREPARING') {
                for (const item of order.items) {
                    if (item.product.stock < item.quantity) {
                        throw new common_1.BadRequestException(`${item.product.name} için yeterli stok yok. Mevcut: ${item.product.stock}`);
                    }
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } },
                    });
                }
            }
            const updatedOrder = await prisma.order.update({
                where: { id },
                data: { status },
                include: {
                    table: true,
                    items: {
                        include: {
                            product: true
                        }
                    }
                },
            });
            this.eventsGateway.notifyOrderStatusUpdate(updatedOrder.cafeId, updatedOrder);
            return updatedOrder;
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