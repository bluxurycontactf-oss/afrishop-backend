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
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const customer_auth_service_1 = require("./customer-auth.service");
const customer_jwt_guard_1 = require("./customer-jwt.guard");
const login_dto_1 = require("./dto/login.dto");
const register_dto_1 = require("./dto/register.dto");
let AuthController = class AuthController {
    constructor(auth, customerAuth) {
        this.auth = auth;
        this.customerAuth = customerAuth;
    }
    register(dto) {
        return this.auth.register(dto);
    }
    login(dto) {
        return this.auth.login(dto);
    }
    customerRegister(dto) {
        return this.customerAuth.register(dto);
    }
    customerLogin(dto) {
        return this.customerAuth.login(dto);
    }
    getMe(req) {
        const { password, ...customer } = req.user;
        return customer;
    }
    async updateMe(req, body) {
        const { prisma } = req.user;
        return this.customerAuth.updateProfile(req.user.id, body);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Créer un compte admin' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Connexion admin' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('customer/register'),
    (0, swagger_1.ApiOperation)({ summary: 'Créer un compte client' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "customerRegister", null);
__decorate([
    (0, common_1.Post)('customer/login'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Connexion client' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "customerLogin", null);
__decorate([
    (0, common_1.Get)('customer/me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(customer_jwt_guard_1.CustomerJwtGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Profil du client connecté' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Put)('customer/me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(customer_jwt_guard_1.CustomerJwtGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Mettre à jour le profil client' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateMe", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        customer_auth_service_1.CustomerAuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map