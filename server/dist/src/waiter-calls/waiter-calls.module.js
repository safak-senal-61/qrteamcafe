"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaiterCallsModule = void 0;
const common_1 = require("@nestjs/common");
const waiter_calls_service_1 = require("./waiter-calls.service");
const waiter_calls_controller_1 = require("./waiter-calls.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const events_module_1 = require("../events/events.module");
let WaiterCallsModule = class WaiterCallsModule {
};
exports.WaiterCallsModule = WaiterCallsModule;
exports.WaiterCallsModule = WaiterCallsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, events_module_1.EventsModule],
        controllers: [waiter_calls_controller_1.WaiterCallsController],
        providers: [waiter_calls_service_1.WaiterCallsService],
    })
], WaiterCallsModule);
//# sourceMappingURL=waiter-calls.module.js.map