import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private notifications: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Envoyer un message de support' })
  async send(@Body() dto: { name: string; contact?: string; message: string }) {
    if (!dto.name?.trim() || !dto.message?.trim()) {
      throw new BadRequestException('Nom et message obligatoires');
    }
    await this.notifications.sendContactMessage({
      name: dto.name.trim(),
      contact: dto.contact?.trim() || '—',
      message: dto.message.trim(),
    });
    return { success: true, message: 'Message envoyé avec succès' };
  }
}
