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
exports.ResiCustomerController = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const resi_customer_guard_1 = require("./resi-customer.guard");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../../config/prisma.service");
let ResiCustomerController = class ResiCustomerController {
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async register(body) {
        const { name, email, password, phone } = body;
        if (!name || !email || !password)
            return { success: false, message: 'Tous les champs sont requis' };
        if (password.length < 6)
            return { success: false, message: 'Mot de passe trop court (6 caractères minimum)' };
        try {
            const exists = await this.prisma.resiCustomer.findUnique({ where: { email } });
            if (exists)
                return { success: false, message: 'Un compte existe déjà avec cet email' };
            const hash = await bcrypt.hash(password, 10);
            const customer = await this.prisma.resiCustomer.create({
                data: { name, email, passwordHash: hash, phone },
            });
            const token = this.jwt.sign({ sub: customer.id, email: customer.email, role: 'RESI_CUSTOMER' }, { expiresIn: '7d' });
            return { success: true, token, customer: { id: customer.id, name: customer.name, email: customer.email } };
        }
        catch (e) {
            return { success: false, message: 'Erreur lors de la création du compte' };
        }
    }
    async login(body) {
        const { email, password } = body;
        if (!email || !password)
            return { success: false, message: 'Email et mot de passe requis' };
        try {
            const customer = await this.prisma.resiCustomer.findUnique({ where: { email } });
            if (!customer)
                return { success: false, message: 'Identifiants incorrects' };
            const valid = await bcrypt.compare(password, customer.passwordHash);
            if (!valid)
                return { success: false, message: 'Identifiants incorrects' };
            const token = this.jwt.sign({ sub: customer.id, email: customer.email, role: 'RESI_CUSTOMER' }, { expiresIn: '7d' });
            return { success: true, token, customer: { id: customer.id, name: customer.name, email: customer.email } };
        }
        catch (e) {
            return { success: false, message: 'Erreur de connexion' };
        }
    }
    async me(req) {
        try {
            const customer = await this.prisma.resiCustomer.findUnique({
                where: { id: req.user.sub },
                select: { id: true, name: true, email: true, phone: true, createdAt: true },
            });
            return customer || { success: false, message: 'Client introuvable' };
        }
        catch (e) {
            return { success: false, message: 'Erreur' };
        }
    }
    async myRequests(req) {
        try {
            return await this.prisma.resiRequest.findMany({
                where: { resiCustomerId: req.user.sub },
                orderBy: { createdAt: 'desc' },
            });
        }
        catch (e) {
            return [];
        }
    }
    async update(req, body) {
        try {
            const customer = await this.prisma.resiCustomer.findUnique({ where: { id: req.user.sub } });
            if (!customer)
                return { success: false, message: 'Client introuvable' };
            const update = {};
            if (body.name)
                update.name = body.name;
            if (body.phone)
                update.phone = body.phone;
            if (body.newPassword) {
                if (!body.currentPassword)
                    return { success: false, message: 'Mot de passe actuel requis' };
                const valid = await bcrypt.compare(body.currentPassword, customer.passwordHash);
                if (!valid)
                    return { success: false, message: 'Mot de passe actuel incorrect' };
                if (body.newPassword.length < 6)
                    return { success: false, message: 'Nouveau mot de passe trop court' };
                update.passwordHash = await bcrypt.hash(body.newPassword, 10);
            }
            await this.prisma.resiCustomer.update({ where: { id: customer.id }, data: update });
            return { success: true, message: 'Profil mis à jour' };
        }
        catch (e) {
            return { success: false, message: 'Erreur lors de la mise à jour' };
        }
    }
};
exports.ResiCustomerController = ResiCustomerController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ResiCustomerController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ResiCustomerController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(resi_customer_guard_1.ResiCustomerGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ResiCustomerController.prototype, "me", null);
__decorate([
    (0, common_1.Get)('requests'),
    (0, common_1.UseGuards)(resi_customer_guard_1.ResiCustomerGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ResiCustomerController.prototype, "myRequests", null);
__decorate([
    (0, common_1.Post)('update'),
    (0, common_1.UseGuards)(resi_customer_guard_1.ResiCustomerGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ResiCustomerController.prototype, "update", null);
exports.ResiCustomerController = ResiCustomerController = __decorate([
    (0, common_1.Controller)('resi/customer'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService])
], ResiCustomerController);
//# sourceMappingURL=resi-customer.controller.js.map