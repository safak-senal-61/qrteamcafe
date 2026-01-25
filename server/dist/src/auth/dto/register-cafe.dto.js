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
exports.RegisterCafeDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RegisterCafeDto {
    cafeName;
    fullName;
    phone;
    email;
    password;
    static _OPENAPI_METADATA_FACTORY() {
        return { cafeName: { required: true, type: () => String }, fullName: { required: true, type: () => String }, phone: { required: true, type: () => String }, email: { required: true, type: () => String, format: "email" }, password: { required: true, type: () => String, minLength: 8, pattern: "/((?=.*\\d)|(?=.*\\W+))(?![.\\n])(?=.*[A-Z])(?=.*[a-z]).*$/" } };
    }
}
exports.RegisterCafeDto = RegisterCafeDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'İşletme adı boş bırakılamaz.' }),
    __metadata("design:type", String)
], RegisterCafeDto.prototype, "cafeName", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Ad Soyad boş bırakılamaz.' }),
    __metadata("design:type", String)
], RegisterCafeDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Telefon numarası boş bırakılamaz.' }),
    __metadata("design:type", String)
], RegisterCafeDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'Geçerli bir e-posta adresi giriniz.' }),
    __metadata("design:type", String)
], RegisterCafeDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Şifre boş bırakılamaz.' }),
    (0, class_validator_1.MinLength)(8, { message: 'Şifre en az 8 karakter olmalıdır.' }),
    (0, class_validator_1.Matches)(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'Şifre en az 1 büyük harf, 1 küçük harf ve 1 rakam veya özel karakter içermelidir.',
    }),
    __metadata("design:type", String)
], RegisterCafeDto.prototype, "password", void 0);
//# sourceMappingURL=register-cafe.dto.js.map