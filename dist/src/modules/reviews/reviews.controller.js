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
exports.ReviewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_key_guard_1 = require("../../common/guards/admin-key.guard");
const prisma_service_1 = require("../../config/prisma.service");
let ReviewsController = class ReviewsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async submit(dto) {
        if (!dto.productId || !dto.rating || !dto.authorName)
            throw new common_1.BadRequestException('Produit, note et nom requis');
        if (dto.rating < 1 || dto.rating > 5)
            throw new common_1.BadRequestException('Note entre 1 et 5');
        const review = await this.prisma.$queryRawUnsafe(`INSERT INTO reviews (id, "productId", rating, title, comment, "isVerified", "isApproved", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, false, false, NOW()) RETURNING *`, dto.productId, dto.rating, dto.title || null, dto.comment || null);
        return { success: true, message: 'Avis soumis ! Il sera visible après validation.' };
    }
    async getByProduct(productId) {
        const reviews = await this.prisma.$queryRawUnsafe(`SELECT *, CAST(rating AS INT) as rating FROM reviews WHERE "productId"=$1 AND "isApproved"=true ORDER BY "createdAt" DESC LIMIT 20`, productId);
        const stats = await this.prisma.$queryRawUnsafe(`SELECT AVG(rating)::FLOAT as avg, COUNT(*)::INT as total FROM reviews WHERE "productId"=$1 AND "isApproved"=true`, productId);
        return { reviews, avgRating: Math.round((stats[0]?.avg || 0) * 10) / 10, total: stats[0]?.total || 0 };
    }
    async findAll(approved) {
        const where = approved !== undefined ? `WHERE "isApproved"=${approved === 'true'}` : '';
        return this.prisma.$queryRawUnsafe(`SELECT r.*, CAST(r.rating AS INT) as rating FROM reviews r ${where} ORDER BY r."createdAt" DESC LIMIT 200`);
    }
    async approve(id) {
        await this.prisma.$queryRawUnsafe(`UPDATE reviews SET "isApproved"=true WHERE id=$1`, id);
        return { success: true };
    }
    async remove(id) {
        await this.prisma.$queryRawUnsafe(`DELETE FROM reviews WHERE id=$1`, id);
        return { success: true };
    }
};
exports.ReviewsController = ReviewsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Soumettre un avis sur un produit' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)('product/:productId'),
    (0, swagger_1.ApiOperation)({ summary: 'Avis approuvés d\'un produit' }),
    __param(0, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "getByProduct", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(admin_key_guard_1.AdminKeyGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Tous les avis (admin)' }),
    __param(0, (0, common_1.Query)('approved')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, common_1.UseGuards)(admin_key_guard_1.AdminKeyGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "approve", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(admin_key_guard_1.AdminKeyGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReviewsController.prototype, "remove", null);
exports.ReviewsController = ReviewsController = __decorate([
    (0, swagger_1.ApiTags)('Avis'),
    (0, common_1.Controller)('reviews'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsController);
//# sourceMappingURL=reviews.controller.js.map