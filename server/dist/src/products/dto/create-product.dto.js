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
exports.CreateProductDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateProductDto {
    categoryId;
    name;
    description;
    price;
    imageUrl;
    isAvailable;
    stock;
    originalPrice;
    isChefRecommended;
    requiresPreparation;
    static _OPENAPI_METADATA_FACTORY() {
        return { categoryId: { required: true, type: () => String, format: "uuid" }, name: { required: true, type: () => String }, description: { required: false, type: () => String }, price: { required: true, type: () => Number, minimum: 0 }, imageUrl: { required: false, type: () => String }, isAvailable: { required: false, type: () => Boolean }, stock: { required: false, type: () => Number, minimum: 0 }, originalPrice: { required: false, type: () => Number, minimum: 0 }, isChefRecommended: { required: false, type: () => Boolean }, requiresPreparation: { required: false, type: () => Boolean } };
    }
}
exports.CreateProductDto = CreateProductDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Kategori seçimi zorunludur.' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Geçersiz kategori ID.' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Ürün adı gereklidir.' }),
    (0, class_validator_1.IsString)({ message: 'Ürün adı metin olmalıdır.' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Fiyat gereklidir.' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'Fiyat sayı olmalıdır.' }),
    (0, class_validator_1.Min)(0, { message: 'Fiyat 0 veya daha büyük olmalıdır.' }),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isAvailable", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'Stok sayı olmalıdır.' }),
    (0, class_validator_1.Min)(0, { message: 'Stok 0 veya daha büyük olmalıdır.' }),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "stock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'İndirimsiz fiyat sayı olmalıdır.' }),
    (0, class_validator_1.Min)(0, { message: 'İndirimsiz fiyat 0 veya daha büyük olmalıdır.' }),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "originalPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isChefRecommended", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "requiresPreparation", void 0);
//# sourceMappingURL=create-product.dto.js.map