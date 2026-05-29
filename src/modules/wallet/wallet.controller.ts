import { Controller, Post, Get, Body, Param, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../config/prisma.service';

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
}
