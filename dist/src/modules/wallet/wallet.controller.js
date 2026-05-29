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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../../config/prisma.service");
const admin_key_guard_1 = require("../../common/guards/admin-key.guard");
function calcFee(amount) {
    if (amount <= 2000)
        return 150;
    return Math.round(amount * 0.03);
}
let WalletController = class WalletController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getBalance(phone) {
        const clean = phone.replace(/\D/g, '').slice(-8);
        const rows = await this.prisma.$queryRawUnsafe(`SELECT * FROM wallets WHERE phone LIKE $1 LIMIT 1`, `%${clean}`);
        if (!rows.length)
            return { phone: clean, balance: 0, exists: false };
        const txs = await this.prisma.$queryRawUnsafe(`SELECT * FROM wallet_transactions WHERE phone LIKE $1 ORDER BY "createdAt" DESC LIMIT 20`, `%${clean}`);
        return { phone: rows[0].phone, balance: Number(rows[0].balance), exists: true, transactions: txs };
    }
    async fromGiftCard(dto) {
        if (!dto.code?.trim() || !dto.phone?.trim())
            throw new common_1.BadRequestException('Code et téléphone requis');
        const code = dto.code.toUpperCase().trim();
        const phone = dto.phone.trim();
        const cards = await this.prisma.$queryRawUnsafe(`SELECT * FROM gift_cards WHERE code = $1`, code);
        if (!cards.length)
            throw new common_1.NotFoundException('Carte cadeau introuvable');
        const card = cards[0];
        if (!card.isActive)
            throw new common_1.BadRequestException('Carte cadeau désactivée');
        const gcBalance = Number(card.balance);
        if (gcBalance <= 0)
            throw new common_1.BadRequestException('Carte cadeau épuisée');
        await this.prisma.$queryRawUnsafe(`UPDATE gift_cards SET balance = 0, "isActive" = false, "usedBy" = $1, "usedAt" = NOW() WHERE id = $2`, `WALLET:${phone}`, card.id);
        const existing = await this.prisma.$queryRawUnsafe(`SELECT * FROM wallets WHERE phone = $1`, phone);
        if (existing.length) {
            await this.prisma.$queryRawUnsafe(`UPDATE wallets SET balance = balance + $1, "updatedAt" = NOW() WHERE phone = $2`, gcBalance, phone);
        }
        else {
            await this.prisma.$queryRawUnsafe(`INSERT INTO wallets (id, phone, balance, "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())`, phone, gcBalance);
        }
        await this.prisma.$queryRawUnsafe(`INSERT INTO wallet_transactions (id, phone, type, amount, description, reference, "createdAt")
       VALUES (gen_random_uuid()::text, $1, 'credit', $2, $3, $4, NOW())`, phone, gcBalance, `Transfert depuis carte cadeau ${code}`, code);
        const updated = await this.prisma.$queryRawUnsafe(`SELECT balance FROM wallets WHERE phone = $1`, phone);
        return {
            success: true,
            transferred: gcBalance,
            newBalance: Number(updated[0]?.balance || gcBalance),
            message: `${gcBalance.toLocaleString()} XOF transférés dans votre portefeuille !`,
        };
    }
    async pay(dto) {
        if (!dto.phone || !dto.amount || !dto.orderRef)
            throw new common_1.BadRequestException('Téléphone, montant et référence requis');
        const phone = dto.phone.trim();
        const wallets = await this.prisma.$queryRawUnsafe(`SELECT * FROM wallets WHERE phone = $1`, phone);
        if (!wallets.length || Number(wallets[0].balance) <= 0)
            throw new common_1.BadRequestException('Portefeuille vide ou introuvable');
        const wallet = wallets[0];
        if (Number(wallet.balance) < dto.amount) {
            throw new common_1.BadRequestException(`Solde insuffisant. Disponible : ${Number(wallet.balance).toLocaleString()} XOF`);
        }
        const newBalance = Number(wallet.balance) - dto.amount;
        await this.prisma.$queryRawUnsafe(`UPDATE wallets SET balance = $1, "updatedAt" = NOW() WHERE phone = $2`, newBalance, phone);
        await this.prisma.$queryRawUnsafe(`INSERT INTO wallet_transactions (id, phone, type, amount, description, reference, "createdAt")
       VALUES (gen_random_uuid()::text, $1, 'debit', $2, $3, $4, NOW())`, phone, dto.amount, `Paiement commande ${dto.orderRef}`, dto.orderRef);
        return {
            success: true,
            paidAmount: dto.amount,
            remainingBalance: newBalance,
            message: `Paiement de ${dto.amount.toLocaleString()} XOF effectué. Solde restant : ${newBalance.toLocaleString()} XOF`,
        };
    }
    getFee(amount) {
        const a = parseFloat(amount);
        if (!a || a <= 0)
            throw new common_1.BadRequestException('Montant invalide');
        if (a > 1000000)
            throw new common_1.BadRequestException('Montant maximum : 1 000 000 XOF');
        const fee = calcFee(a);
        const net = a - fee;
        if (net <= 0)
            throw new common_1.BadRequestException('Montant trop faible après frais');
        return { amount: a, fee, net, feePercent: a <= 2000 ? '150 XOF fixe' : '3%' };
    }
    async withdraw(dto) {
        if (!dto.phone || !dto.amount || !dto.operator || !dto.momoNumber) {
            throw new common_1.BadRequestException('Tous les champs sont requis');
        }
        if (dto.amount < 500)
            throw new common_1.BadRequestException('Montant minimum : 500 XOF');
        if (dto.amount > 1000000)
            throw new common_1.BadRequestException('Montant maximum : 1 000 000 XOF');
        const fee = calcFee(dto.amount);
        const net = dto.amount - fee;
        if (net <= 0)
            throw new common_1.BadRequestException('Montant trop faible après frais');
        const wallets = await this.prisma.$queryRawUnsafe(`SELECT * FROM wallets WHERE phone = $1`, dto.phone.trim());
        if (!wallets.length || Number(wallets[0].balance) < dto.amount) {
            throw new common_1.BadRequestException(`Solde insuffisant. Disponible : ${wallets[0] ? Number(wallets[0].balance).toLocaleString() : 0} XOF`);
        }
        const newBalance = Number(wallets[0].balance) - dto.amount;
        await this.prisma.$queryRawUnsafe(`UPDATE wallets SET balance = $1, "updatedAt" = NOW() WHERE phone = $2`, newBalance, dto.phone.trim());
        await this.prisma.$queryRawUnsafe(`INSERT INTO wallet_transactions (id, phone, type, amount, description, reference, "createdAt")
       VALUES (gen_random_uuid()::text, $1, 'debit', $2, $3, $4, NOW())`, dto.phone.trim(), dto.amount, `Retrait vers ${dto.operator} ${dto.momoNumber}`, `WD-${Date.now()}`);
        const rows = await this.prisma.$queryRawUnsafe(`INSERT INTO withdrawal_requests (id, phone, amount, fee, "netAmount", operator, "momoNumber", status, "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, 'PENDING', NOW())
       RETURNING *`, dto.phone.trim(), dto.amount, fee, net, dto.operator, dto.momoNumber);
        return {
            success: true,
            withdrawalId: rows[0]?.id,
            amount: dto.amount,
            fee,
            netAmount: net,
            operator: dto.operator,
            momoNumber: dto.momoNumber,
            newBalance,
            message: `Demande de retrait de ${net.toLocaleString()} XOF vers ${dto.operator} envoyée. Traitement sous 24h.`,
        };
    }
    async listWithdrawals() {
        return this.prisma.$queryRawUnsafe(`SELECT * FROM withdrawal_requests ORDER BY "createdAt" DESC LIMIT 200`);
    }
    async processWithdrawal(id, dto) {
        await this.prisma.$queryRawUnsafe(`UPDATE withdrawal_requests SET status = 'PROCESSED', note = $1, "processedAt" = NOW() WHERE id = $2`, dto.note || null, id);
        return { success: true };
    }
    async rejectWithdrawal(id, dto) {
        const rows = await this.prisma.$queryRawUnsafe(`SELECT * FROM withdrawal_requests WHERE id = $1`, id);
        if (!rows.length)
            throw new common_1.NotFoundException('Demande introuvable');
        const wd = rows[0];
        if (wd.status !== 'PENDING')
            throw new common_1.BadRequestException('Cette demande n\'est plus en attente');
        await this.prisma.$queryRawUnsafe(`UPDATE wallets SET balance = balance + $1, "updatedAt" = NOW() WHERE phone = $2`, Number(wd.amount), wd.phone);
        await this.prisma.$queryRawUnsafe(`UPDATE withdrawal_requests SET status = 'REJECTED', note = $1, "processedAt" = NOW() WHERE id = $2`, dto.note || null, id);
        return { success: true, refunded: Number(wd.amount) };
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)(':phone'),
    (0, swagger_1.ApiOperation)({ summary: 'Voir le solde du portefeuille' }),
    __param(0, (0, common_1.Param)('phone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Post)('from-gift-card'),
    (0, swagger_1.ApiOperation)({ summary: 'Transférer solde carte cadeau vers portefeuille' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "fromGiftCard", null);
__decorate([
    (0, common_1.Post)('pay'),
    (0, swagger_1.ApiOperation)({ summary: 'Payer une commande avec le portefeuille' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "pay", null);
__decorate([
    (0, common_1.Get)('withdraw/fee/:amount'),
    (0, swagger_1.ApiOperation)({ summary: 'Calculer les frais de retrait' }),
    __param(0, (0, common_1.Param)('amount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getFee", null);
__decorate([
    (0, common_1.Post)('withdraw'),
    (0, swagger_1.ApiOperation)({ summary: 'Demander un retrait vers Mobile Money' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "withdraw", null);
__decorate([
    (0, common_1.Get)('withdrawals'),
    (0, common_1.UseGuards)(admin_key_guard_1.AdminKeyGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Lister les demandes de retrait (admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "listWithdrawals", null);
__decorate([
    (0, common_1.Post)('withdrawals/:id/process'),
    (0, common_1.UseGuards)(admin_key_guard_1.AdminKeyGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Marquer retrait comme traité (admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "processWithdrawal", null);
__decorate([
    (0, common_1.Post)('withdrawals/:id/reject'),
    (0, common_1.UseGuards)(admin_key_guard_1.AdminKeyGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Rejeter un retrait et rembourser (admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "rejectWithdrawal", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('Portefeuille'),
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map