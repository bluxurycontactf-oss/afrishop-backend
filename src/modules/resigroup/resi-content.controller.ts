import { Controller, Get, Put, Post, Param, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ResiGroupService } from './resigroup.service';
import { ResiAdminGuard } from './resi-admin.guard';

@Controller('resi/content')
export class ResiContentController {
  constructor(private service: ResiGroupService) {}

  @Get()
  async getAll() { return this.service.getAllContent(); }

  @Get(':key')
  async getOne(@Param('key') key: string) { return this.service.getContent(key); }

  @Put()
  @UseGuards(ResiAdminGuard)
  @HttpCode(HttpStatus.OK)
  async saveAll(@Body() body: Record<string, any>) {
    await this.service.upsertAllContent(body);
    return { success: true, message: 'Contenu publié avec succès' };
  }

  @Put(':key')
  @UseGuards(ResiAdminGuard)
  @HttpCode(HttpStatus.OK)
  async saveOne(@Param('key') key: string, @Body() body: { data: any }) {
    const row = await this.service.upsertContent(key, body.data);
    return { success: true, row };
  }

  // ── Public: check property availability ────────────────────
  @Post('availability/check')
  @HttpCode(HttpStatus.OK)
  async checkAvailability(@Body() body: { propertyId: string; checkIn: string; checkOut: string }) {
    return this.service.checkAvailability(body.propertyId || '', body.checkIn || '', body.checkOut || '');
  }
}
