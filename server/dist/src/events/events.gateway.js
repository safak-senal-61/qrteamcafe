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
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let EventsGateway = class EventsGateway {
    server;
    activeTables = new Map();
    clientMap = new Map();
    handleConnection(client) {
    }
    handleDisconnect(client) {
        const info = this.clientMap.get(client.id);
        if (info) {
            if (info.role === 'client' && info.tableId) {
                this.checkAndRemoveTable(info.cafeId, info.tableId, client.id);
            }
            this.clientMap.delete(client.id);
        }
    }
    checkAndRemoveTable(cafeId, tableId, leavingSocketId) {
        let isTableStillActive = false;
        for (const [sId, info] of this.clientMap.entries()) {
            if (sId !== leavingSocketId &&
                info.cafeId === cafeId &&
                info.tableId === tableId) {
                isTableStillActive = true;
                break;
            }
        }
        if (!isTableStillActive) {
            const tables = this.activeTables.get(cafeId);
            if (tables) {
                tables.delete(tableId);
                if (tables.size === 0) {
                    this.activeTables.delete(cafeId);
                }
                else {
                    this.activeTables.set(cafeId, tables);
                }
                this.emitActiveTablesUpdate(cafeId);
            }
        }
    }
    handleJoinTable(client, payload) {
        const { cafeId, tableId } = payload;
        this.clientMap.set(client.id, { cafeId, tableId, role: 'client' });
        client.join(`cafe_${cafeId}`);
        client.join(`table_${tableId}`);
        if (!this.activeTables.has(cafeId)) {
            this.activeTables.set(cafeId, new Set());
        }
        this.activeTables.get(cafeId)?.add(tableId);
        this.emitActiveTablesUpdate(cafeId);
    }
    handleJoinAdmin(client, payload) {
        const { cafeId } = payload;
        this.clientMap.set(client.id, { cafeId, role: 'admin' });
        client.join(`cafe_${cafeId}_admin`);
        this.emitActiveTablesUpdate(cafeId);
    }
    emitActiveTablesUpdate(cafeId) {
        const tables = this.activeTables.get(cafeId);
        const count = tables ? tables.size : 0;
        this.server.to(`cafe_${cafeId}_admin`).emit('activeTablesUpdate', count);
    }
    notifyNewOrder(cafeId, order) {
        this.server.to(`cafe_${cafeId}_admin`).emit('newOrder', order);
    }
    notifyOrderStatusUpdate(cafeId, order) {
        if (order.tableId) {
            this.server.to(`table_${order.tableId}`).emit('orderStatusUpdate', order);
        }
        this.server.to(`cafe_${cafeId}_admin`).emit('orderStatusUpdate', order);
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinTable'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleJoinTable", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinAdmin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleJoinAdmin", null);
exports.EventsGateway = EventsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    })
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map