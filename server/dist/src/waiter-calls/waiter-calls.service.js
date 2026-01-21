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
exports.WaiterCallsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const events_gateway_1 = require("../events/events.gateway");
let WaiterCallsService = class WaiterCallsService {
    prisma;
    eventsGateway;
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
    }
    async create(cafeId, createWaiterCallDto) {
        const { tableId, type } = createWaiterCallDto;
        const call = await this.prisma.waiterCall.create({
            data: {
                cafeId,
                tableId,
                type: type || 'Garson',
                status: 'PENDING',
            },
            include: {
                table: true,
            },
        });
        this.eventsGateway.server.to(`cafe_${cafeId}_admin`).emit('waiterCall', call);
        return call;
    }
    async findAll(cafeId, status) {
        return this.prisma.waiterCall.findMany({
            where: {
                cafeId,
                ...(status ? { status } : {}),
            },
            include: {
                table: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async complete(id) {
        const call = await this.prisma.waiterCall.update({
            where: { id },
            data: { status: 'COMPLETED' },
        });
        return call;
    }
    async remove(id) {
        return this.prisma.waiterCall.delete({
            where: { id }
        });
    }
};
exports.WaiterCallsService = WaiterCallsService;
exports.WaiterCallsService = WaiterCallsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway])
], WaiterCallsService);
//# sourceMappingURL=waiter-calls.service.js.map