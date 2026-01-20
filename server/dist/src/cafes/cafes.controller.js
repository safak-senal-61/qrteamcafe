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
exports.CafesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const cafes_service_1 = require("./cafes.service");
const multer_1 = require("multer");
const path_1 = require("path");
let CafesController = class CafesController {
    cafesService;
    constructor(cafesService) {
        this.cafesService = cafesService;
    }
    getStats(cafeId) {
        return this.cafesService.getDashboardStats(cafeId);
    }
    findOne(id) {
        return this.cafesService.findOne(id);
    }
    async uploadLogo(id, file) {
        if (!file) {
            throw new common_1.BadRequestException('Dosya yüklenemedi.');
        }
        const logoUrl = `/uploads/logos/${file.filename}`;
        return this.cafesService.update(id, { logoUrl });
    }
    update(id, body) {
        return this.cafesService.update(id, body);
    }
};
exports.CafesController = CafesController;
__decorate([
    (0, common_1.Get)('my-stats'),
    __param(0, (0, common_1.Query)('cafeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CafesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CafesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/logo'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/logos',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = (0, path_1.extname)(file.originalname);
                callback(null, `cafe-logo-${uniqueSuffix}${ext}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return callback(new common_1.BadRequestException('Sadece resim dosyaları yüklenebilir!'), false);
            }
            callback(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CafesController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CafesController.prototype, "update", null);
exports.CafesController = CafesController = __decorate([
    (0, common_1.Controller)('cafes'),
    __metadata("design:paramtypes", [cafes_service_1.CafesService])
], CafesController);
//# sourceMappingURL=cafes.controller.js.map