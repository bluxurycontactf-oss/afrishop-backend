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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanupController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../../config/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let CleanupController = class CleanupController {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async cleanupAccounts() {
        const now = new Date();
        const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        let deleted2m = 0, deleted6m = 0, warned30 = 0, warned7 = 0;
        const inactive2m = await this.prisma.$queryRawUnsafe(`
      SELECT c.id, c.email, c."firstName"
      FROM customers c
      LEFT JOIN orders o ON o."customerId" = c.id
      WHERE c."lastActivityAt" < $1
        AND o.id IS NULL
        AND c."termsAcceptedAt" IS NOT NULL
    `, twoMonthsAgo);
        for (const c of inactive2m) {
            const wallets = await this.prisma.$queryRawUnsafe(`SELECT balance FROM wallets WHERE phone IN (SELECT phone FROM customers WHERE id=$1)`, c.id);
            const hasBalance = wallets.length && Number(wallets[0]?.balance) > 0;
            if (!hasBalance) {
                if (c.email) {
                    this.notifications.sendAccountDeletion(c.email, c.firstName, '2 mois', false).catch(() => { });
                }
                await this.prisma.$queryRawUnsafe(`DELETE FROM customers WHERE id=$1`, c.id);
                deleted2m++;
            }
        }
        const warn30 = await this.prisma.$queryRawUnsafe(`
      SELECT id, email, "firstName" FROM customers
      WHERE "lastActivityAt" < $1 AND "lastActivityAt" >= $2
        AND "termsAcceptedAt" IS NOT NULL
    `, new Date(sixMonthsAgo.getTime() + 30 * 24 * 60 * 60 * 1000), new Date(sixMonthsAgo.getTime() + 31 * 24 * 60 * 60 * 1000));
        for (const c of warn30) {
            if (c.email)
                this.notifications.sendInactivityWarning(c.email, c.firstName, 30).catch(() => { });
            warned30++;
        }
        const warn7 = await this.prisma.$queryRawUnsafe(`
      SELECT id, email, "firstName" FROM customers
      WHERE "lastActivityAt" < $1 AND "lastActivityAt" >= $2
        AND "termsAcceptedAt" IS NOT NULL
    `, new Date(sixMonthsAgo.getTime() + 7 * 24 * 60 * 60 * 1000), new Date(sixMonthsAgo.getTime() + 8 * 24 * 60 * 60 * 1000));
        for (const c of warn7) {
            if (c.email)
                this.notifications.sendInactivityWarning(c.email, c.firstName, 7).catch(() => { });
            warned7++;
        }
        const inactive6m = await this.prisma.$queryRawUnsafe(`
      SELECT c.id, c.email, c."firstName", c.phone FROM customers c
      WHERE c."lastActivityAt" < $1 AND c."termsAcceptedAt" IS NOT NULL
    `, sixMonthsAgo);
        for (const c of inactive6m) {
            if (c.phone) {
                const wallets = await this.prisma.$queryRawUnsafe(`SELECT * FROM wallets WHERE phone=$1`, c.phone);
                if (wallets.length && Number(wallets[0]?.balance) > 0) {
                    const lostBalance = Number(wallets[0].balance);
                    await this.prisma.$queryRawUnsafe(`UPDATE wallets SET balance=0,"updatedAt"=NOW() WHERE phone=$1`, c.phone);
                    await this.prisma.$queryRawUnsafe(`INSERT INTO wallet_transactions (id,phone,type,amount,description,reference,"createdAt") VALUES (gen_random_uuid()::text,$1,'debit',$2,'Inactivité 6 mois — solde classé perte AfriShop','INACTIVITY',NOW())`, c.phone, lostBalance);
                    if (c.email)
                        this.notifications.sendAccountDeletion(c.email, c.firstName, '6 mois', true, lostBalance).catch(() => { });
                }
                else {
                    if (c.email)
                        this.notifications.sendAccountDeletion(c.email, c.firstName, '6 mois', false).catch(() => { });
                }
            }
            await this.prisma.$queryRawUnsafe(`DELETE FROM customers WHERE id=$1`, c.id);
            deleted6m++;
        }
        return {
            success: true,
            deleted2months: deleted2m,
            deleted6months: deleted6m,
            warned30days: warned30,
            warned7days: warned7,
            processedAt: now.toISOString(),
        };
    }
    async updateActivity() { return { success: true }; }
};
exports.CleanupController = CleanupController;
__decorate([
    (0, common_1.Post)('cleanup-accounts'),
    (0, swagger_1.ApiOperation)({ summary: 'Nettoyer les comptes inactifs (cron quotidien)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CleanupController.prototype, "cleanupAccounts", null);
__decorate([
    (0, common_1.Post)('activity'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CleanupController.prototype, "updateActivity", null);
exports.CleanupController = CleanupController = __decorate([
    (0, swagger_1.ApiTags)('Maintenance'),
    (0, common_1.Controller)('maintenance'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], CleanupController);
//# sourceMappingURL=cleanup.controller.js.map