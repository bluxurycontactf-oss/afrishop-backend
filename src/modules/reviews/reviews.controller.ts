import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminKeyGuard } from '../../common/guards/admin-key.guard';
import { PrismaService } from '../../config/prisma.service';

@ApiTags('Avis')
@Controller('reviews')
export class ReviewsController {
  constructor(private prisma: PrismaService) {}

  /* ── PUBLIC : Soumettre un avis ── */
  @Post()
  @ApiOperation({ summary: 'Soumettre un avis sur un produit' })
  async submit(@Body() dto: { productId: string; rating: number; comment?: string; title?: string; authorName: string }) {
    if (!dto.productId || !dto.rating || !dto.authorName) throw new BadRequestException('Produit, note et nom requis');
    if (dto.rating < 1 || dto.rating > 5) throw new BadRequestException('Note entre 1 et 5');

    const review = await this.prisma.$queryRawUnsafe(
      `INSERT INTO reviews (id, "productId", rating, title, comment, "isVerified", "isApproved", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, false, false, NOW()) RETURNING *`,
      dto.productId, dto.rating, dto.title || null, dto.comment || null,
    );

    return { success: true, message: 'Avis soumis ! Il sera visible après validation.' };
  }

  /* ── PUBLIC : Avis d'un produit ── */
  @Get('product/:productId')
  @ApiOperation({ summary: 'Avis approuvés d\'un produit' })
  async getByProduct(@Param('productId') productId: string) {
    const reviews: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT *, CAST(rating AS INT) as rating FROM reviews WHERE "productId"=$1 AND "isApproved"=true ORDER BY "createdAt" DESC LIMIT 20`,
      productId,
    );
    const stats: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT AVG(rating)::FLOAT as avg, COUNT(*)::INT as total FROM reviews WHERE "productId"=$1 AND "isApproved"=true`,
      productId,
    );
    return { reviews, avgRating: Math.round((stats[0]?.avg || 0) * 10) / 10, total: stats[0]?.total || 0 };
  }

  /* ── ADMIN : Lister tous les avis ── */
  @Get()
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Tous les avis (admin)' })
  async findAll(@Query('approved') approved?: string) {
    const where = approved !== undefined ? `WHERE "isApproved"=${approved === 'true'}` : '';
    return this.prisma.$queryRawUnsafe(`SELECT r.*, CAST(r.rating AS INT) as rating FROM reviews r ${where} ORDER BY r."createdAt" DESC LIMIT 200`);
  }

  /* ── ADMIN : Approuver ── */
  @Post(':id/approve')
  @UseGuards(AdminKeyGuard)
  async approve(@Param('id') id: string) {
    await this.prisma.$queryRawUnsafe(`UPDATE reviews SET "isApproved"=true WHERE id=$1`, id);
    return { success: true };
  }

  /* ── ADMIN : Supprimer ── */
  @Delete(':id')
  @UseGuards(AdminKeyGuard)
  async remove(@Param('id') id: string) {
    await this.prisma.$queryRawUnsafe(`DELETE FROM reviews WHERE id=$1`, id);
    return { success: true };
  }
}
