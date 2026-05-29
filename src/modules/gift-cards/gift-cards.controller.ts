import { Controller, Post, Get, Body, Param, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminKeyGuard } from '../../common/guards/admin-key.guard';
import { PrismaService } from '../../config/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `AFRI-${seg()}-${seg()}-${seg()}`;
}

@ApiTags('Cartes Cadeaux')
@Controller('gift-cards')
export class GiftCardsController {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /* ── PUBLIC : Acheter une carte cadeau ── */
  @Post('purchase')
  @ApiOperation({ summary: 'Acheter une carte cadeau après paiement FedaPay' })
  async purchase(@Body() dto: { amount: number; email: string; transactionId: string; message?: string }) {
    if (!dto.amount || dto.amount < 2000) throw new BadRequestException('Montant minimum : 2000 XOF');
    if (!dto.email?.trim()) throw new BadRequestException('Email requis');
    if (!dto.transactionId) throw new BadRequestException('Transaction FedaPay requise');

    let code = generateCode();
    const existing: any[] = await this.prisma.$queryRawUnsafe(`SELECT id FROM gift_cards WHERE code = $1`, code);
    if (existing.length) code = generateCode();

    await this.prisma.$queryRawUnsafe(
      `INSERT INTO gift_cards (id, code, amount, balance, "isActive", note, "ownerEmail", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, true, $4, $5, NOW())`,
      code, dto.amount, dto.amount,
      `Acheté par ${dto.email} — Tx: ${dto.transactionId}`,
      dto.email,
    );

    this.notifications.sendGiftCard(dto.email, code, dto.amount, dto.message).catch(() => {});
    return { success: true, code, amount: dto.amount, email: dto.email };
  }

  /* ── PUBLIC : Vérifier une carte ── */
  @Get('check/:code')
  @ApiOperation({ summary: 'Vérifier le solde d\'une carte cadeau' })
  async check(@Param('code') code: string) {
    const cards: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id, code, amount, balance, "isActive", "firstUsedAt", "expiresAt", "createdAt" FROM gift_cards WHERE code = $1`,
      code.toUpperCase().trim(),
    );
    if (!cards.length) throw new NotFoundException('Carte cadeau introuvable');
    const card = cards[0];
    if (!card.isActive) throw new BadRequestException('Cette carte cadeau est désactivée ou expirée');
    if (Number(card.balance) <= 0) throw new BadRequestException('Cette carte cadeau est épuisée');

    const now = new Date();
    const expiresAt = card.expiresAt ? new Date(card.expiresAt) : null;
    if (expiresAt && expiresAt < now) {
      throw new BadRequestException('Cette carte cadeau a expiré (14 jours après première utilisation)');
    }

    const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000) : null;

    return {
      code: card.code,
      amount: Number(card.amount),
      balance: Number(card.balance),
      isActive: card.isActive,
      firstUsedAt: card.firstUsedAt || null,
      expiresAt: card.expiresAt || null,
      daysLeft,
      message: card.firstUsedAt
        ? `Valable encore ${daysLeft} jour(s) (expire le ${new Date(card.expiresAt).toLocaleDateString('fr-FR')})`
        : 'Pas encore utilisée — expire 14 jours après la première utilisation',
    };
  }

  /* ── PUBLIC : Utiliser une carte ── */
  @Post('redeem')
  @ApiOperation({ summary: 'Utiliser une carte cadeau pour payer' })
  async redeem(@Body() dto: { code: string; amount: number; orderRef: string; ownerPhone?: string; ownerEmail?: string }) {
    if (!dto.code || !dto.amount || !dto.orderRef) throw new BadRequestException('Code, montant et référence requis');

    const code = dto.code.toUpperCase().trim();
    const cards: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM gift_cards WHERE code = $1`, code,
    );
    if (!cards.length) throw new NotFoundException('Carte cadeau introuvable');
    const card = cards[0];
    if (!card.isActive) throw new BadRequestException('Carte cadeau désactivée ou expirée');
    if (Number(card.balance) < dto.amount) throw new BadRequestException(`Solde insuffisant. Disponible : ${Number(card.balance).toLocaleString()} XOF`);

    const now = new Date();
    // Vérifier expiration
    if (card.expiresAt && new Date(card.expiresAt) < now) {
      throw new BadRequestException('Carte cadeau expirée');
    }

    const isFirstUse = !card.firstUsedAt;
    const expiresAt = isFirstUse ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : null;
    const newBalance = Number(card.balance) - dto.amount;

    // Mettre à jour la carte
    if (isFirstUse) {
      // Première utilisation → démarrer le compte de 14 jours
      const ownerPhone = dto.ownerPhone || card.ownerPhone || null;
      const ownerEmail = dto.ownerEmail || card.ownerEmail || null;
      await this.prisma.$queryRawUnsafe(
        `UPDATE gift_cards SET balance=$1,"usedBy"=$2,"usedAt"=NOW(),"isActive"=$3,"firstUsedAt"=NOW(),"expiresAt"=$4,"ownerPhone"=COALESCE($5,"ownerPhone"),"ownerEmail"=COALESCE($6,"ownerEmail") WHERE id=$7`,
        newBalance, dto.orderRef, newBalance > 0, expiresAt, ownerPhone, ownerEmail, card.id,
      );
      // Notifier l'utilisateur
      const notifEmail = ownerEmail || card.ownerEmail;
      if (notifEmail) {
        this.notifications.sendGiftCardFirstUse(notifEmail, code, newBalance, expiresAt).catch(() => {});
      }
    } else {
      await this.prisma.$queryRawUnsafe(
        `UPDATE gift_cards SET balance=$1,"usedBy"=$2,"usedAt"=NOW(),"isActive"=$3 WHERE id=$4`,
        newBalance, dto.orderRef, newBalance > 0, card.id,
      );
    }

    return {
      success: true,
      usedAmount: dto.amount,
      remainingBalance: newBalance,
      expiresAt: isFirstUse ? expiresAt : card.expiresAt,
      message: isFirstUse && newBalance > 0
        ? `Paiement de ${dto.amount.toLocaleString()} XOF effectué. Solde restant : ${newBalance.toLocaleString()} XOF — valable 14 jours.`
        : `Paiement de ${dto.amount.toLocaleString()} XOF effectué. Solde restant : ${newBalance.toLocaleString()} XOF`,
    };
  }

  /* ── ADMIN : Traiter les cartes expirées (cron) ── */
  @Post('process-expired')
  @ApiOperation({ summary: 'Traiter les cartes expirées — reverser solde vers wallet' })
  async processExpired() {
    const expired: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM gift_cards WHERE "expiresAt" < NOW() AND balance > 0 AND "isActive" = true`,
    );

    let processed = 0;
    for (const card of expired) {
      const balance = Number(card.balance);
      const phone = card.ownerPhone;
      const email = card.ownerEmail;

      // Désactiver la carte
      await this.prisma.$queryRawUnsafe(
        `UPDATE gift_cards SET balance=0,"isActive"=false WHERE id=$1`, card.id,
      );

      // Reverser vers le portefeuille si on a le numéro de téléphone
      if (phone && balance > 0) {
        const wallets: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM wallets WHERE phone=$1`, phone);
        if (wallets.length) {
          await this.prisma.$queryRawUnsafe(`UPDATE wallets SET balance=balance+$1,"updatedAt"=NOW() WHERE phone=$2`, balance, phone);
        } else {
          await this.prisma.$queryRawUnsafe(
            `INSERT INTO wallets (id,phone,balance,"createdAt","updatedAt") VALUES (gen_random_uuid()::text,$1,$2,NOW(),NOW())`,
            phone, balance,
          );
        }
        await this.prisma.$queryRawUnsafe(
          `INSERT INTO wallet_transactions (id,phone,type,amount,description,reference,"createdAt") VALUES (gen_random_uuid()::text,$1,'credit',$2,$3,$4,NOW())`,
          phone, balance, `Expiration carte cadeau ${card.code} — solde reversé`, card.code,
        );
      }

      // Notifier par email
      if (email) {
        this.notifications.sendGiftCardExpired(email, card.code, balance, !!phone).catch(() => {});
      }
      processed++;
    }

    return { success: true, processed, message: `${processed} carte(s) expirée(s) traitée(s)` };
  }

  /* ── ADMIN : Générer des cartes ── */
  @Post('generate')
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Générer des cartes cadeaux (admin)' })
  async generate(@Body() dto: { amount: number; quantity?: number; note?: string; recipientEmail?: string }) {
    if (!dto.amount || dto.amount < 2000) throw new BadRequestException('Montant minimum : 2000 XOF');
    const qty = Math.min(dto.quantity || 1, 50);
    const cards = [];
    for (let i = 0; i < qty; i++) {
      let code = generateCode();
      const existing: any[] = await this.prisma.$queryRawUnsafe(`SELECT id FROM gift_cards WHERE code=$1`, code);
      if (existing.length) code = generateCode();
      await this.prisma.$queryRawUnsafe(
        `INSERT INTO gift_cards (id,code,amount,balance,"isActive",note,"ownerEmail","createdAt") VALUES (gen_random_uuid()::text,$1,$2,$3,true,$4,$5,NOW())`,
        code, dto.amount, dto.amount, dto.note || null, dto.recipientEmail || null,
      );
      cards.push({ code, amount: dto.amount, balance: dto.amount });
      if (dto.recipientEmail) {
        this.notifications.sendGiftCard(dto.recipientEmail, code, dto.amount, dto.note).catch(() => {});
      }
    }
    return { success: true, cards, emailSent: !!dto.recipientEmail };
  }

  /* ── ADMIN : Lister toutes les cartes ── */
  @Get()
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Lister les cartes cadeaux (admin)' })
  async findAll() {
    const cards: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT *,CAST(amount AS FLOAT) as amount,CAST(balance AS FLOAT) as balance FROM gift_cards ORDER BY "createdAt" DESC LIMIT 200`,
    );
    return cards;
  }

  /* ── ADMIN : Désactiver une carte ── */
  @Post(':id/deactivate')
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Désactiver une carte cadeau (admin)' })
  async deactivate(@Param('id') id: string) {
    await this.prisma.$queryRawUnsafe(`UPDATE gift_cards SET "isActive"=false WHERE id=$1`, id);
    return { success: true };
  }
}
