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
exports.ResiRequestController = void 0;
const common_1 = require("@nestjs/common");
const resigroup_service_1 = require("./resigroup.service");
const resi_email_service_1 = require("./resi-email.service");
const resi_admin_guard_1 = require("./resi-admin.guard");
let ResiRequestController = class ResiRequestController {
    constructor(service, email) {
        this.service = service;
        this.email = email;
    }
    async create(body) {
        if (!body.name || !body.phone || !body.type) {
            return { success: false, message: 'Nom, téléphone et type sont requis' };
        }
        const req = await this.service.createRequest(body);
        setImmediate(async () => {
            try {
                if (body.email) {
                    await this.email.sendClientConfirmation({ name: body.name, email: body.email, type: body.type, subject: body.subject, message: body.message, data: body.data });
                }
                await this.email.sendAdminNotification({ name: body.name, email: body.email, phone: body.phone, type: body.type, subject: body.subject, message: body.message, data: body.data });
            }
            catch (e) { }
        });
        return { success: true, id: req.id, message: 'Demande enregistrée. Notre équipe vous contactera sous 2h.' };
    }
    async getAll(type, status) {
        return this.service.getAllRequests(type, status);
    }
    async stats() { return this.service.getRequestStats(); }
    async updateStatus(id, status) {
        const updated = await this.service.updateRequestStatus(id, status);
        if (status === 'DONE' && updated.email) {
            setImmediate(async () => {
                try {
                    await this.email.sendStatusUpdate({ name: updated.name, email: updated.email, type: updated.type, subject: updated.subject, status });
                }
                catch (e) { }
            });
        }
        return updated;
    }
    async delete(id) { await this.service.deleteRequest(id); }
};
exports.ResiRequestController = ResiRequestController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ResiRequestController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(resi_admin_guard_1.ResiAdminGuard),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ResiRequestController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)(resi_admin_guard_1.ResiAdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ResiRequestController.prototype, "stats", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(resi_admin_guard_1.ResiAdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ResiRequestController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(resi_admin_guard_1.ResiAdminGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResiRequestController.prototype, "delete", null);
exports.ResiRequestController = ResiRequestController = __decorate([
    (0, common_1.Controller)('resi/requests'),
    __metadata("design:paramtypes", [resigroup_service_1.ResiGroupService, resi_email_service_1.ResiEmailService])
], ResiRequestController);
//# sourceMappingURL=resi-request.controller.js.map