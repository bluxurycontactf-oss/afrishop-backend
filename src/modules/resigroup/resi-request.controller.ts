import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ResiGroupService } from './resigroup.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('resi/requests')
export class ResiRequestController {
  constructor(private service: ResiGroupService) {}

  // ── Public: submit a request ────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: {
    type: string;
    name: string;
    phone: string;
    email?: string;
    subject?: string;
    message?: string;
    data?: any;
  }) {
    if (!body.name || !body.phone || !body.type) {
      return { success: false, message: 'Nom, téléphone et type sont requis' };
    }
    const req = await this.service.createRequest(body as any);
    return { success: true, id: req.id, message: 'Demande enregistrée. Notre équipe vous contactera sous 2h.' };
  }

  // ── Admin: get all requests ──────────────────────────────────
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.service.getAllRequests(type, status);
  }

  // ── Admin: stats ─────────────────────────────────────────────
  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async stats() {
    return this.service.getRequestStats();
  }

  // ── Admin: update status ─────────────────────────────────────
  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'))
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.service.updateRequestStatus(id, status);
  }

  // ── Admin: delete ────────────────────────────────────────────
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.service.deleteRequest(id);
  }
}
