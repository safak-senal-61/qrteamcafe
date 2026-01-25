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
exports.WaiterCallsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const waiter_calls_service_1 = require("./waiter-calls.service");
const create_waiter_call_dto_1 = require("./dto/create-waiter-call.dto");
let WaiterCallsController = class WaiterCallsController {
    waiterCallsService;
    constructor(waiterCallsService) {
        this.waiterCallsService = waiterCallsService;
    }
    create(cafeId, createWaiterCallDto) {
        return this.waiterCallsService.create(cafeId, createWaiterCallDto);
    }
    findAll(cafeId, status) {
        return this.waiterCallsService.findAll(cafeId, status);
    }
    complete(id) {
        return this.waiterCallsService.complete(id);
    }
    remove(id) {
        return this.waiterCallsService.remove(id);
    }
};
exports.WaiterCallsController = WaiterCallsController;
__decorate([
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Query)('cafeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_waiter_call_dto_1.CreateWaiterCallDto]),
    __metadata("design:returntype", void 0)
], WaiterCallsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Query)('cafeId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WaiterCallsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WaiterCallsController.prototype, "complete", null);
__decorate([
    (0, common_1.Delete)(':id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WaiterCallsController.prototype, "remove", null);
exports.WaiterCallsController = WaiterCallsController = __decorate([
    (0, common_1.Controller)('waiter-calls'),
    __metadata("design:paramtypes", [waiter_calls_service_1.WaiterCallsService])
], WaiterCallsController);
//# sourceMappingURL=waiter-calls.controller.js.map