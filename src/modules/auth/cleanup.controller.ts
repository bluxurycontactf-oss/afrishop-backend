import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../config/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@ApiTags('Maintenance')
@Controller('maintenance')
export class CleanupController {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  @Post('cleanup-accounts')
  @ApiOperation({ summary: 'Nettoyer les comptes inactifs (cron quotidien)' })
  async cleanupAccounts() {
    const now = new Date();
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);

    let deleted2m = 0, deleted6m = 0, warned30 = 0, warned7 = 0;

    // ── 1. Supprimer comptes sans activité ni solde après 2 mois ──
    const inactive2m: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT c.id, c.email, c."firstName"
      FROM customers c
      LEFT JOIN orders o ON o."customerId" = c.id
      WHERE c."lastActivityAt" < $1
        AND o.id IS NULL
        AND c."termsAcceptedAt" IS NOT NULL
    `, twoMonthsAgo);

    for (const c of inactive2m) {
      // Vérifier qu'il n'a pas de wallet
      const wallets: any[] = await this.prisma.$queryRawUnsafe(`SELECT balance FROM wallets WHERE phone IN (SELECT phone FROM customers WHERE id=$1)`, c.id);
      const hasBalance = wallets.length && Number(wallets[0]?.balance) > 0;
      if (!hasBalance) {
        if (c.email) {
          this.notifications.sendAccountDeletion(c.email, c.firstName, '2 mois', false).catch(() => {});
        }
        await this.prisma.$queryRawUnsafe(`DELETE FROM customers WHERE id=$1`, c.id);
        deleted2m++;
      }
    }

    // ── 2. Avertissement 30j avant 6 mois ──
    const warn30: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id, email, "firstName" FROM customers
      WHERE "lastActivityAt" < $1 AND "lastActivityAt" >= $2
        AND "termsAcceptedAt" IS NOT NULL
    `, new Date(sixMonthsAgo.getTime() + 30 * 24 * 60 * 60 * 1000), // 150 jours
       new Date(sixMonthsAgo.getTime() + 31 * 24 * 60 * 60 * 1000));
    for (const c of warn30) {
      if (c.email) this.notifications.sendInactivityWarning(c.email, c.firstName, 30).catch(() => {});
      warned30++;
    }

    // ── 3. Avertissement 7j avant 6 mois ──
    const warn7: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id, email, "firstName" FROM customers
      WHERE "lastActivityAt" < $1 AND "lastActivityAt" >= $2
        AND "termsAcceptedAt" IS NOT NULL
    `, new Date(sixMonthsAgo.getTime() + 7 * 24 * 60 * 60 * 1000),
       new Date(sixMonthsAgo.getTime() + 8 * 24 * 60 * 60 * 1000));
    for (const c of warn7) {
      if (c.email) this.notifications.sendInactivityWarning(c.email, c.firstName, 7).catch(() => {});
      warned7++;
    }

    // ── 4. Supprimer comptes inactifs 6 mois + virer le solde ──
    const inactive6m: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT c.id, c.email, c."firstName", c.phone FROM customers c
      WHERE c."lastActivityAt" < $1 AND c."termsAcceptedAt" IS NOT NULL
    `, sixMonthsAgo);

    for (const c of inactive6m) {
      if (c.phone) {
        const wallets: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM wallets WHERE phone=$1`, c.phone);
        if (wallets.length && Number(wallets[0]?.balance) > 0) {
          const lostBalance = Number(wallets[0].balance);
          await this.prisma.$queryRawUnsafe(`UPDATE wallets SET balance=0,"updatedAt"=NOW() WHERE phone=$1`, c.phone);
          await this.prisma.$queryRawUnsafe(
            `INSERT INTO wallet_transactions (id,phone,type,amount,description,reference,"createdAt") VALUES (gen_random_uuid()::text,$1,'debit',$2,'Inactivité 6 mois — solde classé perte AfriShop','INACTIVITY',NOW())`,
            c.phone, lostBalance,
          );
          if (c.email) this.notifications.sendAccountDeletion(c.email, c.firstName, '6 mois', true, lostBalance).catch(() => {});
        } else {
          if (c.email) this.notifications.sendAccountDeletion(c.email, c.firstName, '6 mois', false).catch(() => {});
        }
      }
      await this.prisma.$queryRawUnsafe(`DELETE FROM customers WHERE id=$1`, c.id);
      deleted6m++;
    }

    return {
      success: true,
      deleted2months: deleted2m,
      deleted6months: deleted6m,
      warned30days: warned30,
      warned7days: warned7,
      processedAt: now.toISOString(),
    };
  }

  // Mettre à jour lastActivityAt
  @Post('activity')
  async updateActivity() { return { success: true }; }
}
