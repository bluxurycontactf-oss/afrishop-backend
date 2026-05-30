import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminKeyGuard } from '../../common/guards/admin-key.guard';
import { PrismaService } from '../../config/prisma.service';
import * as webpush from 'web-push';

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || 'BMrdcsDdB-_V8J8eq1E0udfg-NnxKGoJ4UiyCNlBE72BrYZf1y1MiUgqvKc-6lqiQMf6zJlG_lq2PIwnlxi1KDk';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'H3MTav6FAufutNX62M0kvFsKbeXOLRWtwIrsyScztOI';
const VAPID_EMAIL   = process.env.ADMIN_EMAIL        || 'didilolade@gmail.com';

webpush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC, VAPID_PRIVATE);

@ApiTags('Notifications Push')
@Controller('push')
export class PushController {
  constructor(private prisma: PrismaService) {}

  /* ── PUBLIC : Clé VAPID publique ── */
  @Get('vapid-public-key')
  getPublicKey() {
    return { publicKey: VAPID_PUBLIC };
  }

  /* ── PUBLIC : S'abonner aux notifications ── */
  @Post('subscribe')
  @ApiOperation({ summary: 'Enregistrer un abonnement push' })
  async subscribe(@Body() dto: { endpoint: string; keys: any; userAgent?: string }) {
    if (!dto.endpoint || !dto.keys) return { success: false };
    try {
      await this.prisma.$queryRawUnsafe(
        `INSERT INTO push_subscriptions (id, endpoint, keys, "userAgent", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2::jsonb, $3, NOW())
         ON CONFLICT (endpoint) DO UPDATE SET keys=$2::jsonb, "userAgent"=$3`,
        dto.endpoint,
        JSON.stringify(dto.keys),
        dto.userAgent || null,
      );
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }

  /* ── PUBLIC : Se désabonner ── */
  @Post('unsubscribe')
  async unsubscribe(@Body() dto: { endpoint: string }) {
    await this.prisma.$queryRawUnsafe(`DELETE FROM push_subscriptions WHERE endpoint=$1`, dto.endpoint);
    return { success: true };
  }

  /* ── ADMIN : Envoyer une notification à tous ── */
  @Post('notify')
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Envoyer une notification push à tous les abonnés (admin)' })
  async notifyAll(@Body() dto: { title: string; body: string; url?: string; icon?: string }) {
    const subs: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT endpoint, keys FROM push_subscriptions`,
    );

    let sent = 0, failed = 0;
    const payload = JSON.stringify({
      title: dto.title,
      body: dto.body,
      icon: dto.icon || '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      url: dto.url || 'https://afrishop.web.app',
      data: { url: dto.url || 'https://afrishop.web.app' },
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys,
        }, payload);
        sent++;
      } catch (e: any) {
        // Supprimer les abonnements expirés (410 Gone)
        if (e.statusCode === 410 || e.statusCode === 404) {
          await this.prisma.$queryRawUnsafe(`DELETE FROM push_subscriptions WHERE endpoint=$1`, sub.endpoint);
        }
        failed++;
      }
    }

    return { success: true, sent, failed, total: subs.length };
  }

  /* ── ADMIN : Nombre d'abonnés ── */
  @Get('count')
  @UseGuards(AdminKeyGuard)
  async count() {
    const r: any[] = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*)::INT as count FROM push_subscriptions`);
    return { count: r[0]?.count || 0 };
  }
}
