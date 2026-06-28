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
exports.ResiContentController = void 0;
const common_1 = require("@nestjs/common");
const resigroup_service_1 = require("./resigroup.service");
const resi_admin_guard_1 = require("./resi-admin.guard");
let ResiContentController = class ResiContentController {
    constructor(service) {
        this.service = service;
    }
    async getAll() { return this.service.getAllContent(); }
    async getOne(key) { return this.service.getContent(key); }
    async saveAll(body) {
        await this.service.upsertAllContent(body);
        return { success: true, message: 'Contenu publié avec succès' };
    }
    async saveOne(key, body) {
        const row = await this.service.upsertContent(key, body.data);
        return { success: true, row };
    }
    async checkAvailability(body) {
        return this.service.checkAvailability(body.propertyId || '', body.checkIn || '', body.checkOut || '');
    }
};
exports.ResiContentController = ResiContentController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ResiContentController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':key'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResiContentController.prototype, "getOne", null);
__decorate([
    (0, common_1.Put)(),
    (0, common_1.UseGuards)(resi_admin_guard_1.ResiAdminGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ResiContentController.prototype, "saveAll", null);
__decorate([
    (0, common_1.Put)(':key'),
    (0, common_1.UseGuards)(resi_admin_guard_1.ResiAdminGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResiContentController.prototype, "saveOne", null);
__decorate([
    (0, common_1.Post)('availability/check'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ResiContentController.prototype, "checkAvailability", null);
exports.ResiContentController = ResiContentController = __decorate([
    (0, common_1.Controller)('resi/content'),
    __metadata("design:paramtypes", [resigroup_service_1.ResiGroupService])
], ResiContentController);
//# sourceMappingURL=resi-content.controller.js.map