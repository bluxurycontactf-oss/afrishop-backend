import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ResiGroupService } from './resigroup.service';
import { ResiEmailService } from './resi-email.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('resi/requests')
export class ResiRequestController {
  constructor(
    private service: ResiGroupService,
    private email: ResiEmailService,
  ) {}

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
    resiCustomerId?: string;
  }) {
    if (!body.name || !body.phone || !body.type) {
      return { success: false, message: 'Nom, téléphone et type sont requis' };
    }

    const req = await this.service.createRequest(body as any);

    // Send emails in background (don't await — never block the response)
    setImmediate(async () => {
      try {
        // Email to client if they provided an email
        if (body.email) {
          await this.email.sendClientConfirmation({
            name:    body.name,
            email:   body.email,
            type:    body.type,
            subject: body.subject,
            message: body.message,
            data:    body.data,
          });
        }
        // Email to admin always
        await this.email.sendAdminNotification({
          name:    body.name,
          email:   body.email,
          phone:   body.phone,
          type:    body.type,
          subject: body.subject,
          message: body.message,
          data:    body.data,
        });
      } catch (e) {
        // Email errors never crash the request
      }
    });

    return {
      success: true,
      id: req.id,
      message: 'Demande enregistrée. Notre équipe vous contactera sous 2h.',
    };
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

  // ── Admin: update status + notify client ─────────────────────
  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'))
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const updated = await this.service.updateRequestStatus(id, status);

    // Notify client when status changes to DONE
    if (status === 'DONE' && updated.email) {
      setImmediate(async () => {
        try {
          await this.email.sendStatusUpdate({
            name:    updated.name,
            email:   updated.email,
            type:    updated.type as string,
            subject: updated.subject,
            status,
          });
        } catch (e) {}
      });
    }

    return updated;
  }

  // ── Admin: delete ────────────────────────────────────────────
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.service.deleteRequest(id);
  }
}
