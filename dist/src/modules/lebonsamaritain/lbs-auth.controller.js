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
exports.LbsAuthController = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../../config/prisma.service");
const lbs_admin_guard_1 = require("./lbs-admin.guard");
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000;
function checkBruteForce(ip) {
    const now = Date.now();
    const entry = loginAttempts.get(ip);
    if (entry) {
        if (now < entry.resetAt && entry.count >= MAX_ATTEMPTS) {
            const wait = Math.ceil((entry.resetAt - now) / 60000);
            throw { status: 429, message: `Trop de tentatives. Réessayez dans ${wait} minute(s).` };
        }
        if (now >= entry.resetAt)
            loginAttempts.delete(ip);
    }
}
function recordFailure(ip) {
    const now = Date.now();
    const entry = loginAttempts.get(ip) || { count: 0, resetAt: now + BLOCK_DURATION };
    entry.count += 1;
    if (entry.count === 1)
        entry.resetAt = now + BLOCK_DURATION;
    loginAttempts.set(ip, entry);
}
function clearAttempts(ip) {
    loginAttempts.delete(ip);
}
let LbsAuthController = class LbsAuthController {
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async setup(body) {
        const { email, password, name } = body;
        if (!email || !password)
            return { success: false, message: 'Email et mot de passe requis' };
        if (password.length < 8)
            return { success: false, message: 'Mot de passe trop court (8 caractères minimum)' };
        try {
            const existing = await this.prisma.lbsAdmin.count();
            if (existing > 0)
                return { success: false, message: 'Un compte admin existe déjà. Connectez-vous.' };
            const hash = await bcrypt.hash(password, 12);
            const admin = await this.prisma.lbsAdmin.create({
                data: { email, passwordHash: hash, name: name || 'Admin' },
            });
            const token = this.jwt.sign({ sub: admin.id, email: admin.email, role: 'LBS_ADMIN' }, { expiresIn: '30d' });
            return { success: true, token, name: admin.name, message: 'Compte créé avec succès !' };
        }
        catch (e) {
            return { success: false, message: 'Erreur lors de la création du compte' };
        }
    }
    async login(body, req) {
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        const { email, password } = body;
        if (!email || !password)
            return { success: false, message: 'Email et mot de passe requis' };
        try {
            checkBruteForce(ip);
        }
        catch (e) {
            return { success: false, message: e.message };
        }
        try {
            const admin = await this.prisma.lbsAdmin.findUnique({ where: { email } });
            if (!admin) {
                recordFailure(ip);
                return { success: false, message: 'Identifiants incorrects' };
            }
            const valid = await bcrypt.compare(password, admin.passwordHash);
            if (!valid) {
                recordFailure(ip);
                return { success: false, message: 'Identifiants incorrects' };
            }
            clearAttempts(ip);
            const token = this.jwt.sign({ sub: admin.id, email: admin.email, role: 'LBS_ADMIN' }, { expiresIn: '30d' });
            return { success: true, token, name: admin.name };
        }
        catch (e) {
            return { success: false, message: 'Erreur de connexion' };
        }
    }
    async status() {
        try {
            const count = await this.prisma.lbsAdmin.count();
            return { hasAdmin: count > 0 };
        }
        catch (e) {
            return { hasAdmin: false };
        }
    }
    async refresh(req) {
        const token = this.jwt.sign({ sub: req.user.sub, email: req.user.email, role: 'LBS_ADMIN' }, { expiresIn: '30d' });
        return { success: true, token };
    }
    async update(req, body) {
        const { name, email, currentPassword, newPassword } = body;
        if (!currentPassword)
            return { success: false, message: 'Mot de passe actuel requis' };
        try {
            const admin = await this.prisma.lbsAdmin.findUnique({ where: { id: req.user.sub } });
            if (!admin)
                return { success: false, message: 'Admin introuvable' };
            const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
            if (!valid)
                return { success: false, message: 'Mot de passe actuel incorrect' };
            const updateData = {};
            if (name)
                updateData.name = name;
            if (email)
                updateData.email = email;
            if (newPassword) {
                if (newPassword.length < 8)
                    return { success: false, message: 'Nouveau mot de passe trop court (8 min)' };
                updateData.passwordHash = await bcrypt.hash(newPassword, 12);
            }
            await this.prisma.lbsAdmin.update({ where: { id: admin.id }, data: updateData });
            return { success: true, message: 'Informations mises à jour avec succès' };
        }
        catch (e) {
            return { success: false, message: 'Erreur lors de la mise à jour' };
        }
    }
};
exports.LbsAuthController = LbsAuthController;
__decorate([
    (0, common_1.Post)('setup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LbsAuthController.prototype, "setup", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LbsAuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LbsAuthController.prototype, "status", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.UseGuards)(lbs_admin_guard_1.LbsAdminGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LbsAuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('update'),
    (0, common_1.UseGuards)(lbs_admin_guard_1.LbsAdminGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LbsAuthController.prototype, "update", null);
exports.LbsAuthController = LbsAuthController = __decorate([
    (0, common_1.Controller)('lbs/auth'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService])
], LbsAuthController);
//# sourceMappingURL=lbs-auth.controller.js.map