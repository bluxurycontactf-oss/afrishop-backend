import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

const DEFAULT_CONTENT: Record<string, any> = {
  immo: [], vols: [], cars: [], liv: [],
  restos: [], svcs: [], streaming: [], settings: {},
};

@Injectable()
export class ResiGroupService {
  constructor(private prisma: PrismaService) {}

  // ─── CONTENT ───────────────────────────────────────────────

  async getAllContent(): Promise<Record<string, any>> {
    try {
      const rows = await this.prisma.resiContent.findMany();
      const result: Record<string, any> = { ...DEFAULT_CONTENT };
      for (const row of rows) {
        result[row.key] = row.data;
      }
      return result;
    } catch (e) {
      // Tables not created yet — return defaults
      console.warn('[ResiGroup] resi_content table not ready:', e.message);
      return { ...DEFAULT_CONTENT };
    }
  }

  async getContent(key: string): Promise<any> {
    try {
      const row = await this.prisma.resiContent.findUnique({ where: { key } });
      return row ? row.data : (DEFAULT_CONTENT[key] ?? null);
    } catch (e) {
      console.warn('[ResiGroup] getContent error:', e.message);
      return DEFAULT_CONTENT[key] ?? null;
    }
  }

  async upsertContent(key: string, data: any): Promise<any> {
    try {
      return await this.prisma.resiContent.upsert({
        where: { key },
        update: { data },
        create: { key, data },
      });
    } catch (e) {
      console.error('[ResiGroup] upsertContent error:', e.message);
      throw new Error('Impossible de sauvegarder — tables non créées dans Supabase');
    }
  }

  async upsertAllContent(payload: Record<string, any>): Promise<void> {
    try {
      await Promise.all(
        Object.keys(payload).map(key =>
          this.prisma.resiContent.upsert({
            where: { key },
            update: { data: payload[key] },
            create: { key, data: payload[key] },
          }),
        ),
      );
    } catch (e) {
      console.error('[ResiGroup] upsertAllContent error:', e.message);
      throw new Error('Impossible de sauvegarder — tables non créées dans Supabase');
    }
  }

  // ─── REQUESTS ──────────────────────────────────────────────

  async createRequest(dto: {
    type: any; name: string; phone: string;
    email?: string; subject?: string; message?: string; data?: any;
  }) {
    try {
      return await this.prisma.resiRequest.create({ data: dto });
    } catch (e) {
      console.error('[ResiGroup] createRequest error:', e.message);
      throw new Error('Impossible d\'enregistrer la demande — tables non créées');
    }
  }

  async getAllRequests(type?: string, status?: string) {
    try {
      return await this.prisma.resiRequest.findMany({
        where: {
          ...(type && { type: type as any }),
          ...(status && { status: status as any }),
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.warn('[ResiGroup] getAllRequests error:', e.message);
      return [];
    }
  }

  async updateRequestStatus(id: string, status: string) {
    const req = await this.prisma.resiRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Demande introuvable');
    return this.prisma.resiRequest.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async deleteRequest(id: string) {
    const req = await this.prisma.resiRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Demande introuvable');
    return this.prisma.resiRequest.delete({ where: { id } });
  }

  async getRequestStats() {
    try {
      const [total, newCount, inProgress, done] = await Promise.all([
        this.prisma.resiRequest.count(),
        this.prisma.resiRequest.count({ where: { status: 'NEW' } }),
        this.prisma.resiRequest.count({ where: { status: 'IN_PROGRESS' } }),
        this.prisma.resiRequest.count({ where: { status: 'DONE' } }),
      ]);
      return { total, new: newCount, inProgress, done };
    } catch (e) {
      return { total: 0, new: 0, inProgress: 0, done: 0 };
    }
  }

  // ─── Check property availability ───────────────────────────
  async checkAvailability(propertyId: string, checkIn: string, checkOut: string): Promise<{ available: boolean; message: string }> {
    try {
      const ci = new Date(checkIn);
      const co = new Date(checkOut);
      if (isNaN(ci.getTime()) || isNaN(co.getTime())) return { available: false, message: 'Dates invalides' };
      if (co <= ci) return { available: false, message: 'Date de départ doit être après la date d\'arrivée' };

      const existing = await this.prisma.resiRequest.findMany({
        where: { type: 'IMMOBILIER' as any, status: { in: ['NEW', 'IN_PROGRESS'] as any[] } },
        select: { data: true },
      });

      for (const req of existing) {
        const d = req.data as any;
        if (d && d.propertyId === propertyId && d.checkIn && d.checkOut) {
          const ei = new Date(d.checkIn), eo = new Date(d.checkOut);
          if (ci < eo && co > ei) {
            return { available: false, message: `Déjà réservé du ${d.checkIn} au ${d.checkOut}` };
          }
        }
      }
      return { available: true, message: 'Disponible ✅' };
    } catch (e) { return { available: true, message: 'Disponible' }; }
  }
}
