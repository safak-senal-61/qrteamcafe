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
        });
    }
    async remove(id) {
        return this.prisma.table.delete({
            where: { id },
        });
    }
};
exports.TablesService = TablesService;
exports.TablesService = TablesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TablesService);
//# sourceMappingURL=tables.service.js.map