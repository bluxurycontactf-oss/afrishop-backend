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
exports.ResiAiController = void 0;
const common_1 = require("@nestjs/common");
const resigroup_service_1 = require("./resigroup.service");
const resi_admin_guard_1 = require("./resi-admin.guard");
let ResiAiController = class ResiAiController {
    constructor(service) {
        this.service = service;
    }
    async log(question) {
        return this.service.logUnansweredQuestion(question);
    }
    async knowledge() {
        return this.service.getAiKnowledge();
    }
    async unanswered() {
        return this.service.getUnansweredQuestions();
    }
    async dismiss(id) {
        return this.service.dismissUnansweredQuestion(id);
    }
    async teach(body) {
        if (!body.keywords || !body.answer) {
            return { success: false, message: 'Mots-clés et réponse sont requis' };
        }
        try {
            const created = await this.service.teachAiAnswer(body.keywords, body.answer, body.unansweredId);
            return { success: true, knowledge: created };
        }
        catch (e) {
            return { success: false, message: e.message || 'Erreur lors de l\'enregistrement' };
        }
    }
    async deleteKnowledge(id) {
        return this.service.deleteAiKnowledge(id);
    }
};
exports.ResiAiController = ResiAiController;
__decorate([
    (0, common_1.Post)('log'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('question')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResiAiController.prototype, "log", null);
__decorate([
    (0, common_1.Get)('knowledge'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ResiAiController.prototype, "knowledge", null);
__decorate([
    (0, common_1.Get)('unanswered'),
    (0, common_1.UseGuards)(resi_admin_guard_1.ResiAdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ResiAiController.prototype, "unanswered", null);
__decorate([
    (0, common_1.Delete)('unanswered/:id'),
    (0, common_1.UseGuards)(resi_admin_guard_1.ResiAdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResiAiController.prototype, "dismiss", null);
__decorate([
    (0, common_1.Post)('teach'),
    (0, common_1.UseGuards)(resi_admin_guard_1.ResiAdminGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ResiAiController.prototype, "teach", null);
__decorate([
    (0, common_1.Delete)('knowledge/:id'),
    (0, common_1.UseGuards)(resi_admin_guard_1.ResiAdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ResiAiController.prototype, "deleteKnowledge", null);
exports.ResiAiController = ResiAiController = __decorate([
    (0, common_1.Controller)('resi/ai'),
    __metadata("design:paramtypes", [resigroup_service_1.ResiGroupService])
], ResiAiController);
//# sourceMappingURL=resi-ai.controller.js.map