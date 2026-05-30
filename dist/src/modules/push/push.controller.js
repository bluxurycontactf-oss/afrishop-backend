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
exports.PushController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_key_guard_1 = require("../../common/guards/admin-key.guard");
const prisma_service_1 = require("../../config/prisma.service");
const webpush = require("web-push");
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BMrdcsDdB-_V8J8eq1E0udfg-NnxKGoJ4UiyCNlBE72BrYZf1y1MiUgqvKc-6lqiQMf6zJlG_lq2PIwnlxi1KDk';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'H3MTav6FAufutNX62M0kvFsKbeXOLRWtwIrsyScztOI';
const VAPID_EMAIL = process.env.ADMIN_EMAIL || 'didilolade@gmail.com';
webpush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC, VAPID_PRIVATE);
let PushController = class PushController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getPublicKey() {
        return { publicKey: VAPID_PUBLIC };
    }
    async subscribe(dto) {
        if (!dto.endpoint || !dto.keys)
            return { success: false };
        try {
            await this.prisma.$queryRawUnsafe(`INSERT INTO push_subscriptions (id, endpoint, keys, "userAgent", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2::jsonb, $3, NOW())
         ON CONFLICT (endpoint) DO UPDATE SET keys=$2::jsonb, "userAgent"=$3`, dto.endpoint, JSON.stringify(dto.keys), dto.userAgent || null);
            return { success: true };
        }
        catch (e) {
            return { success: false };
        }
    }
    async unsubscribe(dto) {
        await this.prisma.$queryRawUnsafe(`DELETE FROM push_subscriptions WHERE endpoint=$1`, dto.endpoint);
        return { success: true };
    }
    async notifyAll(dto) {
        const subs = await this.prisma.$queryRawUnsafe(`SELECT endpoint, keys FROM push_subscriptions`);
        let sent = 0, failed = 0;
        const payload = JSON.stringify({
            title: dto.title,
            body: dto.body,
            icon: dto.icon || '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            url: dto.url || 'https://afrishop.web.app',
            data: { url: dto.url || 'https://afrishop.web.app' },
        });
        for (const sub of subs) {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys,
                }, payload);
                sent++;
            }
            catch (e) {
                if (e.statusCode === 410 || e.statusCode === 404) {
                    await this.prisma.$queryRawUnsafe(`DELETE FROM push_subscriptions WHERE endpoint=$1`, sub.endpoint);
                }
                failed++;
            }
        }
        return { success: true, sent, failed, total: subs.length };
    }
    async count() {
        const r = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*)::INT as count FROM push_subscriptions`);
        return { count: r[0]?.count || 0 };
    }
};
exports.PushController = PushController;
__decorate([
    (0, common_1.Get)('vapid-public-key'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PushController.prototype, "getPublicKey", null);
__decorate([
    (0, common_1.Post)('subscribe'),
    (0, swagger_1.ApiOperation)({ summary: 'Enregistrer un abonnement push' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PushController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Post)('unsubscribe'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PushController.prototype, "unsubscribe", null);
__decorate([
    (0, common_1.Post)('notify'),
    (0, common_1.UseGuards)(admin_key_guard_1.AdminKeyGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Envoyer une notification push à tous les abonnés (admin)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PushController.prototype, "notifyAll", null);
__decorate([
    (0, common_1.Get)('count'),
    (0, common_1.UseGuards)(admin_key_guard_1.AdminKeyGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PushController.prototype, "count", null);
exports.PushController = PushController = __decorate([
    (0, swagger_1.ApiTags)('Notifications Push'),
    (0, common_1.Controller)('push'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PushController);
//# sourceMappingURL=push.controller.js.map