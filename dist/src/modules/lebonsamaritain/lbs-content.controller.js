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
exports.LbsContentController = void 0;
const common_1 = require("@nestjs/common");
const lbs_service_1 = require("./lbs.service");
const lbs_admin_guard_1 = require("./lbs-admin.guard");
let LbsContentController = class LbsContentController {
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
};
exports.LbsContentController = LbsContentController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LbsContentController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':key'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LbsContentController.prototype, "getOne", null);
__decorate([
    (0, common_1.Put)(),
    (0, common_1.UseGuards)(lbs_admin_guard_1.LbsAdminGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LbsContentController.prototype, "saveAll", null);
__decorate([
    (0, common_1.Put)(':key'),
    (0, common_1.UseGuards)(lbs_admin_guard_1.LbsAdminGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LbsContentController.prototype, "saveOne", null);
exports.LbsContentController = LbsContentController = __decorate([
    (0, common_1.Controller)('lbs/content'),
    __metadata("design:paramtypes", [lbs_service_1.LbsService])
], LbsContentController);
//# sourceMappingURL=lbs-content.controller.js.map