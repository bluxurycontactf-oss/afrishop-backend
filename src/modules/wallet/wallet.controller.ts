import { Controller, Post, Get, Body, Param, BadRequestException, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../config/prisma.service';
import { AdminKeyGuard } from '../../common/guards/admin-key.guard';

function calcFee(amount: number): number {
  if (amount <= 2000) return 150;
  return Math.round(amount * 0.03);
}

@ApiTags('Portefeuille')
@Controller('wallet')
export class WalletController {
  constructor(private prisma: PrismaService) {}

  // ── Voir le solde ─────────────────────────────────────────────
  @Get(':phone')
  @ApiOperation({ summary: 'Voir le solde du portefeuille' })
  async getBalance(@Param('phone') phone: string) {
    const clean = phone.replace(/\D/g, '').slice(-8);
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM wallets WHERE phone LIKE $1 LIMIT 1`,
      `%${clean}`,
    );
    if (!rows.length) return { phone: clean, balance: 0, exists: false };
    const txs: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM wallet_transactions WHERE phone LIKE $1 ORDER BY "createdAt" DESC LIMIT 20`,
      `%${clean}`,
    );
    return { phone: rows[0].phone, balance: Number(rows[0].balance), exists: true, transactions: txs };
  }

  // ── Transférer solde carte cadeau → portefeuille ──────────────
  @Post('from-gift-card')
  @ApiOperation({ summary: 'Transférer solde carte cadeau vers portefeuille' })
  async fromGiftCard(@Body() dto: { code: string; phone: string }) {
    if (!dto.code?.trim() || !dto.phone?.trim()) throw new BadRequestException('Code et téléphone requis');
    const code = dto.code.toUpperCase().trim();
    const phone = dto.phone.trim();

    // Vérifier la carte cadeau
    const cards: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM gift_cards WHERE code = $1`, code,
    );
    if (!cards.length) throw new NotFoundException('Carte cadeau introuvable');
    const card = cards[0];
    if (!card.isActive) throw new BadRequestException('Carte cadeau désactivée');
    const gcBalance = Number(card.balance);
    if (gcBalance <= 0) throw new BadRequestException('Carte cadeau épuisée');

    // Vider la carte cadeau
    await this.prisma.$queryRawUnsafe(
      `UPDATE gift_cards SET balance = 0, "isActive" = false, "usedBy" = $1, "usedAt" = NOW() WHERE id = $2`,
      `WALLET:${phone}`, card.id,
    );

    // Créditer le portefeuille
    const existing: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM wallets WHERE phone = $1`, phone,
    );
    if (existing.length) {
      await this.prisma.$queryRawUnsafe(
        `UPDATE wallets SET balance = balance + $1, "updatedAt" = NOW() WHERE phone = $2`,
        gcBalance, phone,
      );
    } else {
      await this.prisma.$queryRawUnsafe(
        `INSERT INTO wallets (id, phone, balance, "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())`,
        phone, gcBalance,
      );
    }

    // Enregistrer la transaction
    await this.prisma.$queryRawUnsafe(
      `INSERT INTO wallet_transactions (id, phone, type, amount, description, reference, "createdAt")
       VALUES (gen_random_uuid()::text, $1, 'credit', $2, $3, $4, NOW())`,
      phone, gcBalance, `Transfert depuis carte cadeau ${code}`, code,
    );

    const updated: any[] = await this.prisma.$queryRawUnsafe(`SELECT balance FROM wallets WHERE phone = $1`, phone);
    return {
      success: true,
      transferred: gcBalance,
      newBalance: Number(updated[0]?.balance || gcBalance),
      message: `${gcBalance.toLocaleString()} XOF transférés dans votre portefeuille !`,
    };
  }

  // ── Payer avec le portefeuille ────────────────────────────────
  @Post('pay')
  @ApiOperation({ summary: 'Payer une commande avec le portefeuille' })
  async pay(@Body() dto: { phone: string; amount: number; orderRef: string }) {
    if (!dto.phone || !dto.amount || !dto.orderRef) throw new BadRequestException('Téléphone, montant et référence requis');
    const phone = dto.phone.trim();

    const wallets: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM wallets WHERE phone = $1`, phone);
    if (!wallets.length || Number(wallets[0].balance) <= 0) throw new BadRequestException('Portefeuille vide ou introuvable');
    const wallet = wallets[0];
    if (Number(wallet.balance) < dto.amount) {
      throw new BadRequestException(`Solde insuffisant. Disponible : ${Number(wallet.balance).toLocaleString()} XOF`);
    }

    const newBalance = Number(wallet.balance) - dto.amount;
    await this.prisma.$queryRawUnsafe(
      `UPDATE wallets SET balance = $1, "updatedAt" = NOW() WHERE phone = $2`,
      newBalance, phone,
    );
    await this.prisma.$queryRawUnsafe(
      `INSERT INTO wallet_transactions (id, phone, type, amount, description, reference, "createdAt")
       VALUES (gen_random_uuid()::text, $1, 'debit', $2, $3, $4, NOW())`,
      phone, dto.amount, `Paiement commande ${dto.orderRef}`, dto.orderRef,
    );

    return {
      success: true,
      paidAmount: dto.amount,
      remainingBalance: newBalance,
      message: `Paiement de ${dto.amount.toLocaleString()} XOF effectué. Solde restant : ${newBalance.toLocaleString()} XOF`,
    };
  }

  // ── Simuler les frais de retrait ──────────────────────────────
  @Get('withdraw/fee/:amount')
  @ApiOperation({ summary: 'Calculer les frais de retrait' })
  getFee(@Param('amount') amount: string) {
    const a = parseFloat(amount);
    if (!a || a <= 0) throw new BadRequestException('Montant invalide');
    if (a > 1000000) throw new BadRequestException('Montant maximum : 1 000 000 XOF');
    const fee = calcFee(a);
    const net = a - fee;
    if (net <= 0) throw new BadRequestException('Montant trop faible après frais');
    return { amount: a, fee, net, feePercent: a <= 2000 ? '150 XOF fixe' : '3%' };
  }

  // ── Demander un retrait ───────────────────────────────────────
  @Post('withdraw')
  @ApiOperation({ summary: 'Demander un retrait vers Mobile Money' })
  async withdraw(@Body() dto: { phone: string; amount: number; operator: string; momoNumber: string }) {
    if (!dto.phone || !dto.amount || !dto.operator || !dto.momoNumber) {
      throw new BadRequestException('Tous les champs sont requis');
    }
    if (dto.amount < 500) throw new BadRequestException('Montant minimum : 500 XOF');
    if (dto.amount > 1000000) throw new BadRequestException('Montant maximum : 1 000 000 XOF');

    const fee = calcFee(dto.amount);
    const net = dto.amount - fee;
    if (net <= 0) throw new BadRequestException('Montant trop faible après frais');

    // Vérifier le solde
    const wallets: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM wallets WHERE phone = $1`, dto.phone.trim());
    if (!wallets.length || Number(wallets[0].balance) < dto.amount) {
      throw new BadRequestException(`Solde insuffisant. Disponible : ${wallets[0] ? Number(wallets[0].balance).toLocaleString() : 0} XOF`);
    }

    // Déduire du portefeuille
    const newBalance = Number(wallets[0].balance) - dto.amount;
    await this.prisma.$queryRawUnsafe(`UPDATE wallets SET balance = $1, "updatedAt" = NOW() WHERE phone = $2`, newBalance, dto.phone.trim());

    // Enregistrer transaction
    await this.prisma.$queryRawUnsafe(
      `INSERT INTO wallet_transactions (id, phone, type, amount, description, reference, "createdAt")
       VALUES (gen_random_uuid()::text, $1, 'debit', $2, $3, $4, NOW())`,
      dto.phone.trim(), dto.amount,
      `Retrait vers ${dto.operator} ${dto.momoNumber}`,
      `WD-${Date.now()}`,
    );

    // Créer la demande de retrait
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `INSERT INTO withdrawal_requests (id, phone, amount, fee, "netAmount", operator, "momoNumber", status, "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, 'PENDING', NOW())
       RETURNING *`,
      dto.phone.trim(), dto.amount, fee, net, dto.operator, dto.momoNumber,
    );

    return {
      success: true,
      withdrawalId: rows[0]?.id,
      amount: dto.amount,
      fee,
      netAmount: net,
      operator: dto.operator,
      momoNumber: dto.momoNumber,
      newBalance,
      message: `Demande de retrait de ${net.toLocaleString()} XOF vers ${dto.operator} envoyée. Traitement sous 24h.`,
    };
  }

  // ── ADMIN : Lister les retraits ───────────────────────────────
  @Get('withdrawals')
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Lister les demandes de retrait (admin)' })
  async listWithdrawals() {
    return this.prisma.$queryRawUnsafe(`SELECT * FROM withdrawal_requests ORDER BY "createdAt" DESC LIMIT 200`);
  }

  // ── ADMIN : Traiter un retrait ────────────────────────────────
  @Post('withdrawals/:id/process')
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Marquer retrait comme traité (admin)' })
  async processWithdrawal(@Param('id') id: string, @Body() dto: { note?: string }) {
    await this.prisma.$queryRawUnsafe(
      `UPDATE withdrawal_requests SET status = 'PROCESSED', note = $1, "processedAt" = NOW() WHERE id = $2`,
      dto.note || null, id,
    );
    return { success: true };
  }

  // ── ADMIN : Rejeter un retrait ────────────────────────────────
  @Post('withdrawals/:id/reject')
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Rejeter un retrait et rembourser (admin)' })
  async rejectWithdrawal(@Param('id') id: string, @Body() dto: { note?: string }) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM withdrawal_requests WHERE id = $1`, id);
    if (!rows.length) throw new NotFoundException('Demande introuvable');
    const wd = rows[0];
    if (wd.status !== 'PENDING') throw new BadRequestException('Cette demande n\'est plus en attente');

    // Rembourser le portefeuille
    await this.prisma.$queryRawUnsafe(`UPDATE wallets SET balance = balance + $1, "updatedAt" = NOW() WHERE phone = $2`, Number(wd.amount), wd.phone);
    await this.prisma.$queryRawUnsafe(`UPDATE withdrawal_requests SET status = 'REJECTED', note = $1, "processedAt" = NOW() WHERE id = $2`, dto.note || null, id);

    return { success: true, refunded: Number(wd.amount) };
  }
}
