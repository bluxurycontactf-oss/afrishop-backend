import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../config/prisma.service';
import * as crypto from 'crypto';

// ── FedaPay API ──────────────────────────────────────────────────
// Docs: https://docs.fedapay.com
// - Clé publique (pk_live_...) : utilisée côté navigateur (checkout.html)
// - Clé secrète (sk_live_...) : utilisée ici côté serveur UNIQUEMENT
const FEDAPAY_BASE_URL = 'https://api.fedapay.com/v1';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly secretKey = process.env.FEDAPAY_SECRET_KEY;
  private readonly webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET;

  constructor(private prisma: PrismaService) {}

  // ── Vérifier le statut d'une transaction FedaPay ───────────────
  // Appelé manuellement ou depuis le webhook
  async checkTransactionStatus(fedaTransactionId: string) {
    try {
      const response = await axios.get(
        `${FEDAPAY_BASE_URL}/transactions/${fedaTransactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data?.v1?.transaction;
    } catch (error) {
      this.logger.error(`Erreur vérification FedaPay : ${error.message}`);
      throw new BadRequestException('Impossible de vérifier le paiement');
    }
  }

  // ── Confirmer manuellement un paiement ────────────────────────
  // Utilisé par le frontend quand FedaPay appelle onComplete()
  async confirmPayment(dto: {
    orderRef: string;
    fedaTransactionId: string;
    fedaStatus: string;
    amount: number;
    currency?: string;
    customerEmail?: string;
  }) {
    // 1. Vérifier la transaction côté FedaPay (double confirmation sécurisée)
    const transaction = await this.checkTransactionStatus(dto.fedaTransactionId);

    if (!transaction) {
      throw new BadRequestException('Transaction introuvable sur FedaPay');
    }

    const isApproved =
      transaction.status === 'approved' || transaction.status === 'approved_and_disbursed';

    if (!isApproved) {
      throw new BadRequestException(`Paiement non confirmé : ${transaction.status}`);
    }

    // 2. Chercher la commande en base (si elle existe via NestJS)
    const order = await this.prisma.order.findFirst({
      where: { orderNumber: dto.orderRef },
    });

    if (order) {
      // Mettre à jour le statut de la commande
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      });

      // Créer l'enregistrement de paiement
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

  // ── Webhook FedaPay ───────────────────────────────────────────
  // FedaPay envoie une requête POST à cette URL après chaque paiement
  // Configurer l'URL dans : https://app.fedapay.com → Paramètres → Webhooks
  // URL : https://votre-domaine.com/api/payments/webhook
  async handleWebhook(payload: any, signature?: string) {
    this.logger.log(`📩 Webhook FedaPay reçu : ${JSON.stringify(payload).substring(0, 200)}`);

    // Vérification de la signature (si configurée dans FedaPay)
    if (this.webhookSecret && signature) {
      const expectedSig = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== `sha256=${expectedSig}`) {
        this.logger.warn('Signature webhook invalide — requête rejetée');
        throw new BadRequestException('Signature invalide');
      }
    }

    const event = payload?.name; // ex: 'transaction.approved'
    const transaction = payload?.data?.object;

    if (!transaction) {
      this.logger.warn('Payload webhook vide');
      return { received: true };
    }

    this.logger.log(`🔔 Événement : ${event} | Transaction : ${transaction.id} | Status : ${transaction.status}`);

    // Chercher la commande par la description (contient l'orderRef)
    const description = transaction.description || '';
    const orderRefMatch = description.match(/[A-Z]{3}-[A-Z0-9]+-\d+/);
    const orderRef = orderRefMatch ? orderRefMatch[0] : null;

    const isApproved =
      transaction.status === 'approved' || transaction.status === 'approved_and_disbursed';
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
              amount: transaction.amount / 100, // FedaPay stocke en centimes
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
        } else if (isFailed) {
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

  // ── Lister les paiements (admin) ───────────────────────────────
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
}
