import { Controller, Post, Get, Body, Param, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminKeyGuard } from '../../common/guards/admin-key.guard';
import { PrismaService } from '../../config/prisma.service';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private prisma: PrismaService) {}

  /* ── PUBLIC : Vérifier et appliquer un coupon ── */
  @Post('apply')
  @ApiOperation({ summary: 'Appliquer un code promo' })
  async apply(@Body() dto: { code: string; orderTotal: number }) {
    if (!dto.code || !dto.orderTotal) throw new BadRequestException('Code et total requis');

    const coupons: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM coupons WHERE UPPER(code)=UPPER($1) AND "isActive"=true`, dto.code.trim(),
    );
    if (!coupons.length) throw new NotFoundException('Code promo invalide ou expiré');
    const c = coupons[0];

    if (c.expiresAt && new Date(c.expiresAt) < new Date()) throw new BadRequestException('Code promo expiré');
    if (c.usageLimit && c.usageCount >= c.usageLimit) throw new BadRequestException('Code promo épuisé');
    if (c.minOrder && dto.orderTotal < Number(c.minOrder)) {
      throw new BadRequestException(`Commande minimum : ${Number(c.minOrder).toLocaleString()} XOF`);
    }

    const discount = c.type === 'PERCENTAGE'
      ? Math.round(dto.orderTotal * Number(c.value) / 100)
      : Math.min(Number(c.value), dto.orderTotal);

    return {
      success: true,
      code: c.code,
      type: c.type,
      value: Number(c.value),
      discount,
      newTotal: dto.orderTotal - discount,
      message: c.type === 'PERCENTAGE'
        ? `Code appliqué : -${c.value}% = -${discount.toLocaleString()} XOF`
        : `Code appliqué : -${discount.toLocaleString()} XOF`,
    };
  }

  /* ── ADMIN : Créer un coupon ── */
  @Post()
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Créer un code promo (admin)' })
  async create(@Body() dto: {
    code: string; type: 'PERCENTAGE' | 'FIXED'; value: number;
    minOrder?: number; usageLimit?: number; expiresAt?: string; description?: string;
  }) {
    if (!dto.code || !dto.type || !dto.value) throw new BadRequestException('Code, type et valeur requis');
    const existing: any[] = await this.prisma.$queryRawUnsafe(`SELECT id FROM coupons WHERE UPPER(code)=UPPER($1)`, dto.code);
    if (existing.length) throw new BadRequestException('Ce code existe déjà');

    await this.prisma.$queryRawUnsafe(
      `INSERT INTO coupons (id, code, type, value, "minOrder", "usageLimit", "usageCount", "isActive", "expiresAt", "createdAt")
       VALUES (gen_random_uuid()::text, UPPER($1), $2, $3, $4, $5, 0, true, $6, NOW())`,
      dto.code.trim(), dto.type, dto.value, dto.minOrder || null, dto.usageLimit || null,
      dto.expiresAt ? new Date(dto.expiresAt) : null,
    );
    return { success: true, code: dto.code.toUpperCase() };
  }

  /* ── ADMIN : Lister les coupons ── */
  @Get()
  @UseGuards(AdminKeyGuard)
  async findAll() {
    const coupons: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT *, CAST(value AS FLOAT) as value, CAST("usageCount" AS INT) as "usageCount" FROM coupons ORDER BY "createdAt" DESC`,
    );
    return coupons;
  }

  /* ── ADMIN : Désactiver un coupon ── */
  @Post(':id/deactivate')
  @UseGuards(AdminKeyGuard)
  async deactivate(@Param('id') id: string) {
    await this.prisma.$queryRawUnsafe(`UPDATE coupons SET "isActive"=false WHERE id=$1`, id);
    return { success: true };
  }

  /* ── Incrémenter usage après commande ── */
  @Post(':code/use')
  async use(@Param('code') code: string) {
    await this.prisma.$queryRawUnsafe(`UPDATE coupons SET "usageCount"="usageCount"+1 WHERE UPPER(code)=UPPER($1)`, code);
    return { success: true };
  }
}
