import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ResiGroupService } from './resigroup.service';
import { ResiEmailService } from './resi-email.service';
import { ResiAdminGuard } from './resi-admin.guard';

@Controller('resi/requests')
export class ResiRequestController {
  constructor(private service: ResiGroupService, private email: ResiEmailService) {}

  // ── Public: submit a request ────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: { type: string; name: string; phone: string; email?: string; subject?: string; message?: string; data?: any; resiCustomerId?: string }) {
    if (!body.name || !body.phone || !body.type) {
      return { success: false, message: 'Nom, téléphone et type sont requis' };
    }
    const req = await this.service.createRequest(body as any);

    setImmediate(async () => {
      try {
        if (body.email) {
          await this.email.sendClientConfirmation({ name: body.name, email: body.email, type: body.type, subject: body.subject, message: body.message, data: body.data });
        }
        await this.email.sendAdminNotification({ name: body.name, email: body.email, phone: body.phone, type: body.type, subject: body.subject, message: body.message, data: body.data });
      } catch (e) {}
    });

    return { success: true, id: req.id, message: 'Demande enregistrée. Notre équipe vous contactera sous 2h.' };
  }

  // ── Admin only ───────────────────────────────────────────────
  @Get()
  @UseGuards(ResiAdminGuard)
  async getAll(@Query('type') type?: string, @Query('status') status?: string) {
    return this.service.getAllRequests(type, status);
  }

  @Get('stats')
  @UseGuards(ResiAdminGuard)
  async stats() { return this.service.getRequestStats(); }

  @Patch(':id/status')
  @UseGuards(ResiAdminGuard)
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    const updated = await this.service.updateRequestStatus(id, status);
    if (status === 'DONE' && updated.email) {
      setImmediate(async () => {
        try { await this.email.sendStatusUpdate({ name: updated.name, email: updated.email, type: updated.type as string, subject: updated.subject, status }); }
        catch (e) {}
      });
    }
    return updated;
  }

  @Delete(':id')
  @UseGuards(ResiAdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) { await this.service.deleteRequest(id); }
}
