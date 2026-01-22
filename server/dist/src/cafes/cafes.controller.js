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
const cafes_service_1 = require("./cafes.service");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const update_cafe_dto_1 = require("./dto/update-cafe.dto");
let CafesController = class CafesController {
    cafesService;
    constructor(cafesService) {
        this.cafesService = cafesService;
    }
    findBySlug(slug) {
        return this.cafesService.findBySlug(slug);
    }
    findOne(id) {
        return this.cafesService.findOne(id);
    }
    getDashboardStats(id) {
        return this.cafesService.getDashboardStats(id);
    }
    async uploadLogo(id, file) {
        if (!file) {
            throw new common_1.BadRequestException('Dosya yüklenemedi.');
        }
        const logoUrl = `/uploads/logos/${file.filename}`;
        return this.cafesService.update(id, { logoUrl });
    }
    async uploadCoverImage(id, file) {
        if (!file) {
            throw new common_1.BadRequestException('Dosya yüklenemedi.');
        }
        const coverImageUrl = `/uploads/covers/${file.filename}`;
        return this.cafesService.update(id, { coverImageUrl });
    }
    update(id, updateCafeDto) {
        return this.cafesService.update(id, updateCafeDto);
    }
};
exports.CafesController = CafesController;
__decorate([
    (0, common_1.Get)('slug/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CafesController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CafesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/dashboard-stats'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CafesController.prototype, "getDashboardStats", null);
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
    (0, common_1.Patch)(':id/cover-image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/covers',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = (0, path_1.extname)(file.originalname);
                callback(null, `cafe-cover-${uniqueSuffix}${ext}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return callback(new common_1.BadRequestException('Sadece resim dosyaları yüklenebilir!'), false);
            }
            callback(null, true);
        },
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CafesController.prototype, "uploadCoverImage", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_cafe_dto_1.UpdateCafeDto]),
    __metadata("design:returntype", void 0)
], CafesController.prototype, "update", null);
exports.CafesController = CafesController = __decorate([
    (0, common_1.Controller)('cafes'),
    __metadata("design:paramtypes", [cafes_service_1.CafesService])
], CafesController);
//# sourceMappingURL=cafes.controller.js.map