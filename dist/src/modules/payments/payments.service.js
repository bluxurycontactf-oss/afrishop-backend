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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const prisma_service_1 = require("../../config/prisma.service");
const crypto = require("crypto");
const FEDAPAY_BASE_URL = 'https://api.fedapay.com/v1';
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(PaymentsService_1.name);
        this.secretKey = process.env.FEDAPAY_SECRET_KEY;
        this.webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET;
    }
    async checkTransactionStatus(fedaTransactionId) {
        try {
            const response = await axios_1.default.get(`${FEDAPAY_BASE_URL}/transactions/${fedaTransactionId}`, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.data?.v1?.transaction;
        }
        catch (error) {
            this.logger.error(`Erreur vérification FedaPay : ${error.message}`);
            throw new common_1.BadRequestException('Impossible de vérifier le paiement');
        }
    }
    async confirmPayment(dto) {
        const transaction = await this.checkTransactionStatus(dto.fedaTransactionId);
        if (!transaction) {
            throw new common_1.BadRequestException('Transaction introuvable sur FedaPay');
        }
        const isApproved = transaction.status === 'approved' || transaction.status === 'approved_and_disbursed';
        if (!isApproved) {
            throw new common_1.BadRequestException(`Paiement non confirmé : ${transaction.status}`);
        }
        const order = await this.prisma.order.findFirst({
            where: { orderNumber: dto.orderRef },
        });
        if (order) {
            await this.prisma.order.update({
                where: { id: order.id },
                data: { status: 'PAID' },
            });
            await this.prisma.payment.upsert({
                where: { orderId: order.id },
                create: {
                    orderId: order.id,
                    amount: dto.amount,
                    currency: dto.currency || 'XOF',
                    method: 'FEDAPAY',
                    status: 'COMPLETED',
                    transactionId: String(dto.fedaTransactionId),
                    operator: transaction.payment_method || 'FEDAPAY',
                    paidAt: new Date(),
                    gatewayData: transaction,
                },
                update: {
                    status: 'COMPLETED',
                    transactionId: String(dto.fedaTransactionId),
                    paidAt: new Date(),
                    gatewayData: transaction,
                },
            });
            this.logger.log(`✅ Paiement FedaPay confirmé : ${dto.orderRef} (#${dto.fedaTransactionId})`);
        }
        return {
            success: true,
            orderRef: dto.orderRef,
            transactionId: dto.fedaTransactionId,
            status: transaction.status,
            amount: transaction.amount,
            currency: transaction.currency.iso,
            paymentMethod: transaction.payment_method,
        };
    }
    async handleWebhook(payload, signature) {
        this.logger.log(`📩 Webhook FedaPay reçu : ${JSON.stringify(payload).substring(0, 200)}`);
        if (this.webhookSecret && signature) {
            const expectedSig = crypto
                .createHmac('sha256', this.webhookSecret)
                .update(JSON.stringify(payload))
                .digest('hex');
            if (signature !== `sha256=${expectedSig}`) {
                this.logger.warn('Signature webhook invalide — requête rejetée');
                throw new common_1.BadRequestException('Signature invalide');
            }
        }
        const event = payload?.name;
        const transaction = payload?.data?.object;
        if (!transaction) {
            this.logger.warn('Payload webhook vide');
            return { received: true };
        }
        this.logger.log(`🔔 Événement : ${event} | Transaction : ${transaction.id} | Status : ${transaction.status}`);
        const description = transaction.description || '';
        const orderRefMatch = description.match(/[A-Z]{3}-[A-Z0-9]+-\d+/);
        const orderRef = orderRefMatch ? orderRefMatch[0] : null;
        const isApproved = transaction.status === 'approved' || transaction.status === 'approved_and_disbursed';
        const isFailed = transaction.status === 'declined' || transaction.status === 'canceled';
        if (orderRef) {
            const order = await this.prisma.order.findFirst({
                where: { orderNumber: orderRef },
            });
            if (order) {
                if (isApproved) {
                    await this.prisma.order.update({
                        where: { id: order.id },
                        data: { status: 'PAID' },
                    });
                    await this.prisma.payment.upsert({
                        where: { orderId: order.id },
                        create: {
                            orderId: order.id,
                            amount: transaction.amount / 100,
                            currency: transaction.currency?.iso || 'XOF',
                            method: 'FEDAPAY',
                            status: 'COMPLETED',
                            transactionId: String(transaction.id),
                            operator: transaction.payment_method || 'FEDAPAY',
                            paidAt: new Date(),
                            gatewayData: transaction,
                        },
                        update: {
                            status: 'COMPLETED',
                            transactionId: String(transaction.id),
                            paidAt: new Date(),
                            gatewayData: transaction,
                        },
                    });
                    this.logger.log(`✅ Commande ${orderRef} marquée PAYÉE via webhook`);
                }
                else if (isFailed) {
                    await this.prisma.order.update({
                        where: { id: order.id },
                        data: { status: 'PAYMENT_PENDING' },
                    });
                    this.logger.log(`❌ Paiement échoué pour ${orderRef}`);
                }
            }
        }
        return { received: true };
    }
    async findAll(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                skip,
                take: limit,
                include: { order: { select: { orderNumber: true, customerName: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.payment.count(),
        ]);
        return { payments, total, page, pages: Math.ceil(total / limit) };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map