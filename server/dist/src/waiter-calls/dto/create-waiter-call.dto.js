"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWaiterCallDto = void 0;
const openapi = require("@nestjs/swagger");
class CreateWaiterCallDto {
    tableId;
    type;
    static _OPENAPI_METADATA_FACTORY() {
        return { tableId: { required: true, type: () => String }, type: { required: false, type: () => String } };
    }
}
exports.CreateWaiterCallDto = CreateWaiterCallDto;
//# sourceMappingURL=create-waiter-call.dto.js.map