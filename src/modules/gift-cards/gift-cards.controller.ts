import { Controller, Post, Get, Body, Param, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminKeyGuard } from '../../common/guards/admin-key.guard';
import { PrismaService } from '../../config/prisma.service';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `AFRI-${seg()}-${seg()}-${seg()}`;
}

@ApiTags('Cartes Cadeaux')
@Controller('gift-cards')
export class GiftCardsController {
  constructor(private prisma: PrismaService) {}

  /* ── PUBLIC : Vérifier une carte ── */
  @Get('check/:code')
  @ApiOperation({ summary: 'Vérifier le solde d\'une carte cadeau' })
  async check(@Param('code') code: string) {
    const cards: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id, code, amount, balance, "isActive", "createdAt" FROM gift_cards WHERE code = $1`,
      code.toUpperCase().trim(),
    );
    if (!cards.length) throw new NotFoundException('Carte cadeau introuvable');
    const card = cards[0];
    if (!card.isActive) throw new BadRequestException('Cette carte cadeau est désactivée');
    if (Number(card.balance) <= 0) throw new BadRequestException('Cette carte cadeau est épuisée');
    return {
      code: card.code,
      amount: Number(card.amount),
      balance: Number(card.balance),
      isActive: card.isActive,
    };
  }

  /* ── PUBLIC : Utiliser une carte ── */
  @Post('redeem')
  @ApiOperation({ summary: 'Utiliser une carte cadeau pour payer' })
  async redeem(@Body() dto: { code: string; amount: number; orderRef: string }) {
    if (!dto.code || !dto.amount || !dto.orderRef) {
      throw new BadRequestException('Code, montant et référence commande requis');
    }
    const code = dto.code.toUpperCase().trim();
    const cards: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id, code, amount, balance, "isActive" FROM gift_cards WHERE code = $1`,
      code,
    );
    if (!cards.length) throw new NotFoundException('Carte cadeau introuvable');
    const card = cards[0];
    if (!card.isActive) throw new BadRequestException('Carte cadeau désactivée');
    if (Number(card.balance) < dto.amount) throw new BadRequestException(`Solde insuffisant. Solde disponible : ${card.balance} XOF`);

    const newBalance = Number(card.balance) - dto.amount;
    await this.prisma.$queryRawUnsafe(
      `UPDATE gift_cards SET balance = $1, "usedBy" = $2, "usedAt" = NOW(), "isActive" = $3 WHERE id = $4`,
      newBalance,
      dto.orderRef,
      newBalance > 0,
      card.id,
    );

    return {
      success: true,
      usedAmount: dto.amount,
      remainingBalance: newBalance,
      message: `Paiement de ${dto.amount.toLocaleString()} XOF effectué. Solde restant : ${newBalance.toLocaleString()} XOF`,
    };
  }

  /* ── ADMIN : Créer des cartes ── */
  @Post('generate')
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Générer des cartes cadeaux (admin)' })
  async generate(@Body() dto: { amount: number; quantity?: number; note?: string }) {
    if (!dto.amount || dto.amount < 2000) {
      throw new BadRequestException('Montant minimum : 2000 XOF');
    }
    const qty = Math.min(dto.quantity || 1, 50);
    const cards = [];
    for (let i = 0; i < qty; i++) {
      let code = generateCode();
      // S'assurer que le code est unique
      const existing: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id FROM gift_cards WHERE code = $1`, code,
      );
      while (existing.length) {
        code = generateCode();
        const check: any[] = await this.prisma.$queryRawUnsafe(
          `SELECT id FROM gift_cards WHERE code = $1`, code,
        );
        if (!check.length) break;
      }
      await this.prisma.$queryRawUnsafe(
        `INSERT INTO gift_cards (id, code, amount, balance, "isActive", note, "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, true, $4, NOW())`,
        code, dto.amount, dto.amount, dto.note || null,
      );
      cards.push({ code, amount: dto.amount, balance: dto.amount });
    }
    return { success: true, cards };
  }

  /* ── ADMIN : Lister toutes les cartes ── */
  @Get()
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Lister les cartes cadeaux (admin)' })
  async findAll() {
    const cards: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT *, CAST(amount AS FLOAT) as amount, CAST(balance AS FLOAT) as balance
       FROM gift_cards ORDER BY "createdAt" DESC LIMIT 200`,
    );
    return cards;
  }

  /* ── ADMIN : Désactiver une carte ── */
  @Post(':id/deactivate')
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Désactiver une carte cadeau (admin)' })
  async deactivate(@Param('id') id: string) {
    await this.prisma.$queryRawUnsafe(
      `UPDATE gift_cards SET "isActive" = false WHERE id = $1`, id,
    );
    return { success: true };
  }
}
