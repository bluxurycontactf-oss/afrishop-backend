import {
  Controller, Get, Put, Param, Body,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ResiGroupService } from './resigroup.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('resi/content')
export class ResiContentController {
  constructor(private service: ResiGroupService) {}

  // ── Public: pages load all content ──────────────────────────
  @Get()
  async getAll() {
    return this.service.getAllContent();
  }

  @Get(':key')
  async getOne(@Param('key') key: string) {
    return this.service.getContent(key);
  }

  // ── Admin: save all content at once (Publish button) ────────
  @Put()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async saveAll(@Body() body: Record<string, any>) {
    await this.service.upsertAllContent(body);
    return { success: true, message: 'Contenu publié avec succès' };
  }

  // ── Admin: save one section ──────────────────────────────────
  @Put(':key')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async saveOne(@Param('key') key: string, @Body() body: { data: any }) {
    const row = await this.service.upsertContent(key, body.data);
    return { success: true, row };
  }
}
