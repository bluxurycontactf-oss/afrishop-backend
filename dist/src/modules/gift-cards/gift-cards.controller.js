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
exports.GiftCardsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_key_guard_1 = require("../../common/guards/admin-key.guard");
const prisma_service_1 = require("../../config/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `AFRI-${seg()}-${seg()}-${seg()}`;
}
let GiftCardsController = class GiftCardsController {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async check(code) {
        const cards = await this.prisma.$queryRawUnsafe(`SELECT id, code, amount, balance, "isActive", "createdAt" FROM gift_cards WHERE code = $1`, code.toUpperCase().trim());
        if (!cards.length)
            throw new common_1.NotFoundException('Carte cadeau introuvable');
        const card = cards[0];
        if (!card.isActive)
            throw new common_1.BadRequestException('Cette carte cadeau est désactivée');
        if (Number(card.balance) <= 0)
            throw new common_1.BadRequestException('Cette carte cadeau est épuisée');
        return {
            code: card.code,
            amount: Number(card.amount),
            balance: Number(card.balance),
            isActive: card.isActive,
        };
    }
    async redeem(dto) {
        if (!dto.code || !dto.amount || !dto.orderRef) {
            throw new common_1.BadRequestException('Code, montant et référence commande requis');
        }
        const code = dto.code.toUpperCase().trim();
        const cards = await this.prisma.$queryRawUnsafe(`SELECT id, code, amount, balance, "isActive" FROM gift_cards WHERE code = $1`, code);
        if (!cards.length)
            throw new common_1.NotFoundException('Carte cadeau introuvable');
        const card = cards[0];
        if (!card.isActive)
            throw new common_1.BadRequestException('Carte cadeau désactivée');
        if (Number(card.balance) < dto.amount)
            throw new common_1.BadRequestException(`Solde insuffisant. Solde disponible : ${card.balance} XOF`);
        const newBalance = Number(card.balance) - dto.amount;
        await this.prisma.$queryRawUnsafe(`UPDATE gift_cards SET balance = $1, "usedBy" = $2, "usedAt" = NOW(), "isActive" = $3 WHERE id = $4`, newBalance, dto.orderRef, newBalance > 0, card.id);
        return {
            success: true,
            usedAmount: dto.amount,
            remainingBalance: newBalance,
            message: `Paiement de ${dto.amount.toLocaleString()} XOF effectué. Solde restant : ${newBalance.toLocaleString()} XOF`,
        };
    }
    async generate(dto) {
        if (!dto.amount || dto.amount < 2000) {
            throw new common_1.BadRequestException('Montant minimum : 2000 XOF');
        }
        const qty = Math.min(dto.quantity || 1, 50);
        const cards = [];
        for (let i = 0; i < qty; i++) {
            let code = generateCode();
            const existing = await this.prisma.$queryRawUnsafe(`SELECT id FROM gift_cards WHERE code = $1`, code);
            while (existing.length) {
                code = generateCode();
                const check = await this.prisma.$queryRawUnsafe(`SELECT id FROM gift_cards WHERE code = $1`, code);
                if (!check.length)
                    break;
            }
            await this.prisma.$queryRawUnsafe(`INSERT INTO gift_cards (id, code, amount, balance, "isActive", note, "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, true, $4, NOW())`, code, dto.amount, dto.amount, dto.note || null);
            cards.push({ code, amount: dto.amount, balance: dto.amount });
            if (dto.recipientEmail) {
                this.notifications.sendGiftCard(dto.recipientEmail, code, dto.amount, dto.note).catch(() => { });
            }
        }
        return { success: true, cards, emailSent: !!dto.recipientEmail };
    }
    async findAll() {
        const cards = await this.prisma.$queryRawUnsafe(`SELECT *, CAST(amount AS FLOAT) as amount, CAST(balance AS FLOAT) as balance
       FROM gift_cards ORDER BY "createdAt" DESC LIMIT 200`);
        return cards;
    }
    async deactivate(id) {
        await this.prisma.$queryRawUnsafe(`UPDATE gift_cards SET "isActive" = false WHERE id = $1`, id);
        return { success: true };
    }
};
exports.GiftCardsController = GiftCardsController;
__decorate([
    (0, common_1.Get)('check/:code'),
    (0, swagger_1.ApiOperation)({ summary: 'Vérifier le solde d\'une carte cadeau' }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "check", null);
__decorate([
    (0, common_1.Post)('redeem'),
    (0, swagger_1.ApiOperation)({ summary: 'Utiliser une carte cadeau pour payer' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "redeem", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.UseGuards)(admin_key_guard_1.AdminKeyGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Générer des cartes cadeaux (admin)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(admin_key_guard_1.AdminKeyGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Lister les cartes cadeaux (admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':id/deactivate'),
    (0, common_1.UseGuards)(admin_key_guard_1.AdminKeyGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Désactiver une carte cadeau (admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "deactivate", null);
exports.GiftCardsController = GiftCardsController = __decorate([
    (0, swagger_1.ApiTags)('Cartes Cadeaux'),
    (0, common_1.Controller)('gift-cards'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], GiftCardsController);
//# sourceMappingURL=gift-cards.controller.js.map