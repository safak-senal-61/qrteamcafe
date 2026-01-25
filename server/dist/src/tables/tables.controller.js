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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TablesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const tables_service_1 = require("./tables.service");
const create_table_dto_1 = require("./dto/create-table.dto");
let TablesController = class TablesController {
    tablesService;
    constructor(tablesService) {
        this.tablesService = tablesService;
    }
    create(createTableDto, cafeId) {
        return this.tablesService.create(cafeId, createTableDto);
    }
    moveTable(cafeId, body) {
        return this.tablesService.moveTable(cafeId, body.fromTableId, body.toTableId);
    }
    findAll(cafeId) {
        return this.tablesService.findAll(cafeId);
    }
    remove(id) {
        return this.tablesService.remove(id);
    }
};
exports.TablesController = TablesController;
__decorate([
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('cafeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_table_dto_1.CreateTableDto, String]),
    __metadata("design:returntype", void 0)
], TablesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('move'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Query)('cafeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TablesController.prototype, "moveTable", null);
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Query)('cafeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TablesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Delete)(':id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TablesController.prototype, "remove", null);
exports.TablesController = TablesController = __decorate([
    (0, common_1.Controller)('tables'),
    __metadata("design:paramtypes", [tables_service_1.TablesService])
], TablesController);
//# sourceMappingURL=tables.controller.js.map