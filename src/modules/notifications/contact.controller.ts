import { Controller, Post, Get, Put, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminKeyGuard } from '../../common/guards/admin-key.guard';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../config/prisma.service';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(
    private notifications: NotificationsService,
    private prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Envoyer un message de support' })
  async send(@Body() dto: { name: string; contact?: string; message: string }) {
    if (!dto.name?.trim() || !dto.message?.trim()) {
      throw new BadRequestException('Nom et message obligatoires');
    }

    // Sauvegarder en base de données
    const msg = await this.prisma.$queryRawUnsafe(
      `INSERT INTO contact_messages (id, name, contact, message, "isRead", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, false, NOW())
       RETURNING *`,
      dto.name.trim(),
      dto.contact?.trim() || null,
      dto.message.trim(),
    );

    // Envoyer email à l'admin (en arrière-plan, ne bloque pas)
    this.notifications.sendContactMessage({
      name: dto.name.trim(),
      contact: dto.contact?.trim() || '—',
      message: dto.message.trim(),
    }).catch(() => {});

    return { success: true, message: 'Message envoyé avec succès' };
  }

  @Get()
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Lister les messages (admin)' })
  async findAll() {
    const messages = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM contact_messages ORDER BY "createdAt" DESC LIMIT 100`,
    );
    return messages;
  }

  @Put(':id/read')
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Marquer comme lu (admin)' })
  async markRead(@Param('id') id: string) {
    await this.prisma.$queryRawUnsafe(
      `UPDATE contact_messages SET "isRead" = true WHERE id = $1`,
      id,
    );
    return { success: true };
  }

  @Put(':id/delete')
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Supprimer un message (admin)' })
  async deleteMsg(@Param('id') id: string) {
    await this.prisma.$queryRawUnsafe(
      `DELETE FROM contact_messages WHERE id = $1`,
      id,
    );
    return { success: true };
  }
}
