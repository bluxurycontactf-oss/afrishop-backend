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
exports.ContactController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_key_guard_1 = require("../../common/guards/admin-key.guard");
const notifications_service_1 = require("./notifications.service");
const prisma_service_1 = require("../../config/prisma.service");
let ContactController = class ContactController {
    constructor(notifications, prisma) {
        this.notifications = notifications;
        this.prisma = prisma;
    }
    async send(dto) {
        if (!dto.name?.trim() || !dto.message?.trim()) {
            throw new common_1.BadRequestException('Nom et message obligatoires');
        }
        const msg = await this.prisma.$queryRawUnsafe(`INSERT INTO contact_messages (id, name, contact, message, "isRead", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, false, NOW())
       RETURNING *`, dto.name.trim(), dto.contact?.trim() || null, dto.message.trim());
        this.notifications.sendContactMessage({
            name: dto.name.trim(),
            contact: dto.contact?.trim() || '—',
            message: dto.message.trim(),
        }).catch(() => { });
        return { success: true, message: 'Message envoyé avec succès' };
    }
    async findAll() {
        const messages = await this.prisma.$queryRawUnsafe(`SELECT * FROM contact_messages ORDER BY "createdAt" DESC LIMIT 100`);
        return messages;
    }
    async markRead(id) {
        await this.prisma.$queryRawUnsafe(`UPDATE contact_messages SET "isRead" = true WHERE id = $1`, id);
        return { success: true };
    }
    async deleteMsg(id) {
        await this.prisma.$queryRawUnsafe(`DELETE FROM contact_messages WHERE id = $1`, id);
        return { success: true };
    }
};
exports.ContactController = ContactController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Envoyer un message de support' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "send", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(admin_key_guard_1.AdminKeyGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Lister les messages (admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "findAll", null);
__decorate([
    (0, common_1.Put)(':id/read'),
    (0, common_1.UseGuards)(admin_key_guard_1.AdminKeyGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Marquer comme lu (admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "markRead", null);
__decorate([
    (0, common_1.Put)(':id/delete'),
    (0, common_1.UseGuards)(admin_key_guard_1.AdminKeyGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Supprimer un message (admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "deleteMsg", null);
exports.ContactController = ContactController = __decorate([
    (0, swagger_1.ApiTags)('Contact'),
    (0, common_1.Controller)('contact'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService,
        prisma_service_1.PrismaService])
], ContactController);
//# sourceMappingURL=contact.controller.js.map