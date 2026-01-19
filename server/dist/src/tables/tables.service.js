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
exports.TablesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TablesService = class TablesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(cafeId, createTableDto) {
        const existingTable = await this.prisma.table.findUnique({
            where: {
                cafeId_tableNumber: {
                    cafeId,
                    tableNumber: createTableDto.tableNumber,
                },
            },
        });
        if (existingTable) {
            throw new common_1.ConflictException('Bu masa numarası zaten mevcut.');
        }
        return this.prisma.table.create({
            data: {
                ...createTableDto,
                cafeId,
            },
        });
    }
    async findAll(cafeId) {
        return this.prisma.table.findMany({
            where: { cafeId },
            orderBy: { tableNumber: 'asc' },
            include: {
                waiterCalls: {
                    where: { status: 'PENDING' },
                },
            },
        });
    }
    async remove(id) {
        return this.prisma.table.delete({
            where: { id },
        });
    }
    async moveTable(cafeId, fromTableId, toTableId) {
        return this.prisma.$transaction(async (prisma) => {
            const sourceOrders = await prisma.order.findMany({
                where: {
                    tableId: fromTableId,
                    status: { not: 'PAID' },
                },
            });
            if (sourceOrders.length === 0) {
                throw new common_1.BadRequestException('Taşınacak aktif sipariş bulunamadı.');
            }
            const targetTable = await prisma.table.findUnique({
                where: { id: toTableId },
            });
            if (!targetTable) {
                throw new common_1.NotFoundException('Hedef masa bulunamadı.');
            }
            await prisma.order.updateMany({
                where: {
                    tableId: fromTableId,
                    status: { not: 'PAID' },
                },
                data: {
                    tableId: toTableId,
                },
            });
            await prisma.table.update({
                where: { id: fromTableId },
                data: { isOccupied: false },
            });
            await prisma.table.update({
                where: { id: toTableId },
                data: { isOccupied: true },
            });
            return { message: 'Masa başarıyla taşındı' };
        });
    }
};
exports.TablesService = TablesService;
exports.TablesService = TablesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TablesService);
//# sourceMappingURL=tables.service.js.map