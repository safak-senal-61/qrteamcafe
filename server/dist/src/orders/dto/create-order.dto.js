"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateOrderDto = void 0;
const openapi = require("@nestjs/swagger");
class CreateOrderDto {
    tableId;
    customerId;
    totalAmount;
    items;
    static _OPENAPI_METADATA_FACTORY() {
        return { tableId: { required: false, type: () => String }, customerId: { required: false, type: () => String }, totalAmount: { required: false, type: () => Number }, items: { required: true, type: () => [({ productId: { required: true, type: () => String }, quantity: { required: true, type: () => Number }, unitPrice: { required: true, type: () => Number }, note: { required: false, type: () => String } })] } };
    }
}
exports.CreateOrderDto = CreateOrderDto;
//# sourceMappingURL=create-order.dto.js.map