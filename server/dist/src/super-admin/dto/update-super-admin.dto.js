"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSuperAdminDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_super_admin_dto_1 = require("./create-super-admin.dto");
class UpdateSuperAdminDto extends (0, swagger_1.PartialType)(create_super_admin_dto_1.CreateSuperAdminDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateSuperAdminDto = UpdateSuperAdminDto;
//# sourceMappingURL=update-super-admin.dto.js.map