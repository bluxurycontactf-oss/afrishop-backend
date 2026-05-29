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
    async purchase(dto) {
        if (!dto.amount || dto.amount < 2000)
            throw new common_1.BadRequestException('Montant minimum : 2000 XOF');
        if (!dto.email?.trim())
            throw new common_1.BadRequestException('Email requis');
        if (!dto.transactionId)
            throw new common_1.BadRequestException('Transaction FedaPay requise');
        let code = generateCode();
        const existing = await this.prisma.$queryRawUnsafe(`SELECT id FROM gift_cards WHERE code = $1`, code);
        if (existing.length)
            code = generateCode();
        await this.prisma.$queryRawUnsafe(`INSERT INTO gift_cards (id, code, amount, balance, "isActive", note, "ownerEmail", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, true, $4, $5, NOW())`, code, dto.amount, dto.amount, `Acheté par ${dto.email} — Tx: ${dto.transactionId}`, dto.email);
        this.notifications.sendGiftCard(dto.email, code, dto.amount, dto.message).catch(() => { });
        return { success: true, code, amount: dto.amount, email: dto.email };
    }
    async check(code) {
        const cards = await this.prisma.$queryRawUnsafe(`SELECT id, code, amount, balance, "isActive", "firstUsedAt", "expiresAt", "createdAt" FROM gift_cards WHERE code = $1`, code.toUpperCase().trim());
        if (!cards.length)
            throw new common_1.NotFoundException('Carte cadeau introuvable');
        const card = cards[0];
        if (!card.isActive)
            throw new common_1.BadRequestException('Cette carte cadeau est désactivée ou expirée');
        if (Number(card.balance) <= 0)
            throw new common_1.BadRequestException('Cette carte cadeau est épuisée');
        const now = new Date();
        const expiresAt = card.expiresAt ? new Date(card.expiresAt) : null;
        if (expiresAt && expiresAt < now) {
            throw new common_1.BadRequestException('Cette carte cadeau a expiré (14 jours après première utilisation)');
        }
        const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000) : null;
        return {
            code: card.code,
            amount: Number(card.amount),
            balance: Number(card.balance),
            isActive: card.isActive,
            firstUsedAt: card.firstUsedAt || null,
            expiresAt: card.expiresAt || null,
            daysLeft,
            message: card.firstUsedAt
                ? `Valable encore ${daysLeft} jour(s) (expire le ${new Date(card.expiresAt).toLocaleDateString('fr-FR')})`
                : 'Pas encore utilisée — expire 14 jours après la première utilisation',
        };
    }
    async redeem(dto) {
        if (!dto.code || !dto.amount || !dto.orderRef)
            throw new common_1.BadRequestException('Code, montant et référence requis');
        const code = dto.code.toUpperCase().trim();
        const cards = await this.prisma.$queryRawUnsafe(`SELECT * FROM gift_cards WHERE code = $1`, code);
        if (!cards.length)
            throw new common_1.NotFoundException('Carte cadeau introuvable');
        const card = cards[0];
        if (!card.isActive)
            throw new common_1.BadRequestException('Carte cadeau désactivée ou expirée');
        if (Number(card.balance) < dto.amount)
            throw new common_1.BadRequestException(`Solde insuffisant. Disponible : ${Number(card.balance).toLocaleString()} XOF`);
        const now = new Date();
        if (card.expiresAt && new Date(card.expiresAt) < now) {
            throw new common_1.BadRequestException('Carte cadeau expirée');
        }
        const isFirstUse = !card.firstUsedAt;
        const expiresAt = isFirstUse ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : null;
        const newBalance = Number(card.balance) - dto.amount;
        if (isFirstUse) {
            const ownerPhone = dto.ownerPhone || card.ownerPhone || null;
            const ownerEmail = dto.ownerEmail || card.ownerEmail || null;
            await this.prisma.$queryRawUnsafe(`UPDATE gift_cards SET balance=$1,"usedBy"=$2,"usedAt"=NOW(),"isActive"=$3,"firstUsedAt"=NOW(),"expiresAt"=$4,"ownerPhone"=COALESCE($5,"ownerPhone"),"ownerEmail"=COALESCE($6,"ownerEmail") WHERE id=$7`, newBalance, dto.orderRef, newBalance > 0, expiresAt, ownerPhone, ownerEmail, card.id);
            const notifEmail = ownerEmail || card.ownerEmail;
            if (notifEmail) {
                this.notifications.sendGiftCardFirstUse(notifEmail, code, newBalance, expiresAt).catch(() => { });
            }
        }
        else {
            await this.prisma.$queryRawUnsafe(`UPDATE gift_cards SET balance=$1,"usedBy"=$2,"usedAt"=NOW(),"isActive"=$3 WHERE id=$4`, newBalance, dto.orderRef, newBalance > 0, card.id);
        }
        return {
            success: true,
            usedAmount: dto.amount,
            remainingBalance: newBalance,
            expiresAt: isFirstUse ? expiresAt : card.expiresAt,
            message: isFirstUse && newBalance > 0
                ? `Paiement de ${dto.amount.toLocaleString()} XOF effectué. Solde restant : ${newBalance.toLocaleString()} XOF — valable 14 jours.`
                : `Paiement de ${dto.amount.toLocaleString()} XOF effectué. Solde restant : ${newBalance.toLocaleString()} XOF`,
        };
    }
    async processExpired() {
        const expired = await this.prisma.$queryRawUnsafe(`SELECT * FROM gift_cards WHERE "expiresAt" < NOW() AND balance > 0 AND "isActive" = true`);
        let processed = 0;
        for (const card of expired) {
            const balance = Number(card.balance);
            const phone = card.ownerPhone;
            const email = card.ownerEmail;
            await this.prisma.$queryRawUnsafe(`UPDATE gift_cards SET balance=0,"isActive"=false WHERE id=$1`, card.id);
            if (phone && balance > 0) {
                const wallets = await this.prisma.$queryRawUnsafe(`SELECT * FROM wallets WHERE phone=$1`, phone);
                if (wallets.length) {
                    await this.prisma.$queryRawUnsafe(`UPDATE wallets SET balance=balance+$1,"updatedAt"=NOW() WHERE phone=$2`, balance, phone);
                }
                else {
                    await this.prisma.$queryRawUnsafe(`INSERT INTO wallets (id,phone,balance,"createdAt","updatedAt") VALUES (gen_random_uuid()::text,$1,$2,NOW(),NOW())`, phone, balance);
                }
                await this.prisma.$queryRawUnsafe(`INSERT INTO wallet_transactions (id,phone,type,amount,description,reference,"createdAt") VALUES (gen_random_uuid()::text,$1,'credit',$2,$3,$4,NOW())`, phone, balance, `Expiration carte cadeau ${card.code} — solde reversé`, card.code);
            }
            if (email) {
                this.notifications.sendGiftCardExpired(email, card.code, balance, !!phone).catch(() => { });
            }
            processed++;
        }
        return { success: true, processed, message: `${processed} carte(s) expirée(s) traitée(s)` };
    }
    async generate(dto) {
        if (!dto.amount || dto.amount < 2000)
            throw new common_1.BadRequestException('Montant minimum : 2000 XOF');
        const qty = Math.min(dto.quantity || 1, 50);
        const cards = [];
        for (let i = 0; i < qty; i++) {
            let code = generateCode();
            const existing = await this.prisma.$queryRawUnsafe(`SELECT id FROM gift_cards WHERE code=$1`, code);
            if (existing.length)
                code = generateCode();
            await this.prisma.$queryRawUnsafe(`INSERT INTO gift_cards (id,code,amount,balance,"isActive",note,"ownerEmail","createdAt") VALUES (gen_random_uuid()::text,$1,$2,$3,true,$4,$5,NOW())`, code, dto.amount, dto.amount, dto.note || null, dto.recipientEmail || null);
            cards.push({ code, amount: dto.amount, balance: dto.amount });
            if (dto.recipientEmail) {
                this.notifications.sendGiftCard(dto.recipientEmail, code, dto.amount, dto.note).catch(() => { });
            }
        }
        return { success: true, cards, emailSent: !!dto.recipientEmail };
    }
    async findAll() {
        const cards = await this.prisma.$queryRawUnsafe(`SELECT *,CAST(amount AS FLOAT) as amount,CAST(balance AS FLOAT) as balance FROM gift_cards ORDER BY "createdAt" DESC LIMIT 200`);
        return cards;
    }
    async deactivate(id) {
        await this.prisma.$queryRawUnsafe(`UPDATE gift_cards SET "isActive"=false WHERE id=$1`, id);
        return { success: true };
    }
};
exports.GiftCardsController = GiftCardsController;
__decorate([
    (0, common_1.Post)('purchase'),
    (0, swagger_1.ApiOperation)({ summary: 'Acheter une carte cadeau après paiement FedaPay' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "purchase", null);
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
    (0, common_1.Post)('process-expired'),
    (0, swagger_1.ApiOperation)({ summary: 'Traiter les cartes expirées — reverser solde vers wallet' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "processExpired", null);
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