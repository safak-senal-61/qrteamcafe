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
exports.AuthController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const register_cafe_dto_1 = require("./dto/register-cafe.dto");
const login_dto_1 = require("./dto/login.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const verify_code_dto_1 = require("./dto/verify-code.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
const passport_1 = require("@nestjs/passport");
const throttler_1 = require("@nestjs/throttler");
const register_customer_dto_1 = require("./dto/register-customer.dto");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async registerCustomer(dto) {
        return this.authService.registerCustomer(dto);
    }
    async verifyCustomer(dto) {
        return this.authService.verifyCustomer(dto);
    }
    async loginCustomer(dto) {
        return this.authService.loginCustomer(dto);
    }
    async forgotPasswordCustomer(dto) {
        return this.authService.forgotPasswordCustomer(dto);
    }
    async verifyCodeCustomer(dto) {
        return this.authService.verifyResetCodeCustomer(dto);
    }
    async resetPasswordCustomer(dto) {
        return this.authService.resetPasswordCustomer(dto);
    }
    async changePassword(dto) {
        return this.authService.changePassword(dto);
    }
    async register(dto) {
        return this.authService.registerCafe(dto);
    }
    async login(dto, req) {
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];
        return this.authService.login(dto, ip, userAgent);
    }
    async forgotPassword(dto) {
        return this.authService.forgotPassword(dto);
    }
    async verifyCode(dto) {
        return this.authService.verifyResetCode(dto);
    }
    async resetPassword(dto) {
        return this.authService.resetPassword(dto);
    }
    async getProfile(req) {
        return this.authService.getProfile(req.user.id);
    }
    async generate2FA(req) {
        return this.authService.generate2FASecret(req.user.id);
    }
    async enable2FA(req, code) {
        return this.authService.enable2FA(req.user.id, code);
    }
    async disable2FA(req) {
        return this.authService.disable2FA(req.user.id);
    }
    async getSessions(req) {
        return this.authService.getSessions(req.user.id);
    }
    async terminateSession(req, sessionId) {
        return this.authService.terminateSession(req.user.id, sessionId);
    }
    async terminateAllOtherSessions(req) {
        return this.authService.terminateAllOtherSessions(req.user.id, req.user.sessionId);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('customer/register'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_customer_dto_1.RegisterCustomerDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerCustomer", null);
__decorate([
    (0, common_1.Post)('customer/verify'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_code_dto_1.VerifyCodeDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyCustomer", null);
__decorate([
    (0, common_1.Post)('customer/login'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginCustomer", null);
__decorate([
    (0, common_1.Post)('customer/forgot-password'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPasswordCustomer", null);
__decorate([
    (0, common_1.Post)('customer/verify-code'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_code_dto_1.VerifyCodeDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyCodeCustomer", null);
__decorate([
    (0, common_1.Post)('customer/reset-password'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPasswordCustomer", null);
__decorate([
    (0, common_1.Post)('change-password'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('register'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_cafe_dto_1.RegisterCafeDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('verify-code'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_code_dto_1.VerifyCodeDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyCode", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('me'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('2fa/generate'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "generate2FA", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('2fa/enable'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "enable2FA", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('2fa/disable'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "disable2FA", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('sessions'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getSessions", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Delete)('sessions/:id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "terminateSession", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Delete)('sessions'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "terminateAllOtherSessions", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map