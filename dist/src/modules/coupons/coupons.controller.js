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
exports.CouponsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_key_guard_1 = require("../../common/guards/admin-key.guard");
const prisma_service_1 = require("../../config/prisma.service");
let CouponsController = class CouponsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async apply(dto) {
        if (!dto.code || !dto.orderTotal)
            throw new common_1.BadRequestException('Code et total requis');
        const coupons = await this.prisma.$queryRawUnsafe(`SELECT * FROM coupons WHERE UPPER(code)=UPPER($1) AND "isActive"=true`, dto.code.trim());
        if (!coupons.length)
            throw new common_1.NotFoundException('Code promo invalide ou expiré');
        const c = coupons[0];
        if (c.expiresAt && new Date(c.expiresAt) < new Date())
            throw new common_1.BadRequestException('Code promo expiré');
        if (c.usageLimit && c.usageCount >= c.usageLimit)
            throw new common_1.BadRequestException('Code promo épuisé');
        if (c.minOrder && dto.orderTotal < Number(c.minOrder)) {
            throw new common_1.BadRequestException(`Commande minimum : ${Number(c.minOrder).toLocaleString()} XOF`);
        }
        const discount = c.type === 'PERCENTAGE'
            ? Math.round(dto.orderTotal * Number(c.value) / 100)
            : Math.min(Number(c.value), dto.orderTotal);
        return {
            success: true,
            code: c.code,
            type: c.type,
            value: Number(c.value),
            discount,
            newTotal: dto.orderTotal - discount,
            message: c.type === 'PERCENTAGE'
                ? `Code appliqué : -${c.value}% = -${discount.toLocaleString()} XOF`
                : `Code appliqué : -${discount.toLocaleString()} XOF`,
        };
    }
    async create(dto) {
        if (!dto.code || !dto.type || !dto.value)
            throw new common_1.BadRequestException('Code, type et valeur requis');
        const existing = await this.prisma.$queryRawUnsafe(`SELECT id FROM coupons WHERE UPPER(code)=UPPER($1)`, dto.code);
        if (existing.length)
            throw new common_1.BadRequestException('Ce code existe déjà');
        await this.prisma.$queryRawUnsafe(`INSERT INTO coupons (id, code, type, value, "minOrder", "usageLimit", "usageCount", "isActive", "expiresAt", "createdAt")
       VALUES (gen_random_uuid()::text, UPPER($1), $2, $3, $4, $5, 0, true, $6, NOW())`, dto.code.trim(), dto.type, dto.value, dto.minOrder || null, dto.usageLimit || null, dto.expiresAt ? new Date(dto.expiresAt) : null);
        return { success: true, code: dto.code.toUpperCase() };
    }
    async findAll() {
        const coupons = await this.prisma.$queryRawUnsafe(`SELECT *, CAST(value AS FLOAT) as value, CAST("usageCount" AS INT) as "usageCount" FROM coupons ORDER BY "createdAt" DESC`);
        return coupons;
    }
    async deactivate(id) {
        await this.prisma.$queryRawUnsafe(`UPDATE coupons SET "isActive"=false WHERE id=$1`, id);
        return { success: true };
    }
    async use(code) {
        await this.prisma.$queryRawUnsafe(`UPDATE coupons SET "usageCount"="usageCount"+1 WHERE UPPER(code)=UPPER($1)`, code);
        return { success: true };
    }
};
exports.CouponsController = CouponsController;
__decorate([
    (0, common_1.Post)('apply'),
    (0, swagger_1.ApiOperation)({ summary: 'Appliquer un code promo' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "apply", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(admin_key_guard_1.AdminKeyGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Créer un code promo (admin)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(admin_key_guard_1.AdminKeyGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':id/deactivate'),
    (0, common_1.UseGuards)(admin_key_guard_1.AdminKeyGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Post)(':code/use'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CouponsController.prototype, "use", null);
exports.CouponsController = CouponsController = __decorate([
    (0, swagger_1.ApiTags)('Coupons'),
    (0, common_1.Controller)('coupons'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CouponsController);
//# sourceMappingURL=coupons.controller.js.map