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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const payments_service_1 = require("./payments.service");
let PaymentsController = class PaymentsController {
    constructor(payments) {
        this.payments = payments;
    }
    confirm(dto) {
        return this.payments.confirmPayment(dto);
    }
    check(transactionId) {
        return this.payments.checkTransactionStatus(transactionId);
    }
    webhook(payload, signature) {
        return this.payments.handleWebhook(payload, signature);
    }
    findAll(page = 1, limit = 20) {
        return this.payments.findAll(Number(page), Number(limit));
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('confirm'),
    (0, swagger_1.ApiOperation)({ summary: 'Confirmer un paiement FedaPay (appelé par le frontend)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "confirm", null);
__decorate([
    (0, common_1.Get)('check/:transactionId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiOperation)({ summary: 'Vérifier le statut d\'une transaction FedaPay' }),
    __param(0, (0, common_1.Param)('transactionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "check", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, swagger_1.ApiOperation)({ summary: 'Webhook FedaPay — reçoit les confirmations de paiement automatiques' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-fedapay-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "webhook", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiOperation)({ summary: 'Lister tous les paiements (admin)' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findAll", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Paiements'),
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map