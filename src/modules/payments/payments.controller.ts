import {
  Controller, Post, Get, Body, Param,
  Query, UseGuards, Headers, RawBodyRequest, Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('Paiements')
@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  // ── Confirmer un paiement FedaPay depuis le frontend ─────────
  // Appelé après que FedaPay appelle onComplete() dans checkout.html
  @Post('confirm')
  @ApiOperation({ summary: 'Confirmer un paiement FedaPay (appelé par le frontend)' })
  confirm(
    @Body()
    dto: {
      orderRef: string;
      fedaTransactionId: string;
      fedaStatus: string;
      amount: number;
      currency?: string;
      customerEmail?: string;
    },
  ) {
    return this.payments.confirmPayment(dto);
  }

  // ── Vérifier le statut d'une transaction FedaPay ─────────────
  @Get('check/:transactionId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Vérifier le statut d\'une transaction FedaPay' })
  check(@Param('transactionId') transactionId: string) {
    return this.payments.checkTransactionStatus(transactionId);
  }

  // ── Webhook FedaPay ───────────────────────────────────────────
  // Configurer dans FedaPay : https://app.fedapay.com → Paramètres → Webhooks
  // URL : https://votre-domaine.com/api/payments/webhook
  @Post('webhook')
  @ApiOperation({ summary: 'Webhook FedaPay — reçoit les confirmations de paiement automatiques' })
  webhook(
    @Body() payload: any,
    @Headers('x-fedapay-signature') signature: string,
  ) {
    return this.payments.handleWebhook(payload, signature);
  }

  // ── Lister les paiements (admin) ──────────────────────────────
  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Lister tous les paiements (admin)' })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.payments.findAll(Number(page), Number(limit));
  }
}
