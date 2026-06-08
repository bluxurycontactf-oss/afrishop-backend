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

  // ─── Check property availability (with next available dates) ─
  async checkAvailability(propertyId: string, checkIn: string, checkOut: string): Promise<{
    available: boolean;
    message: string;
    nextAvailableFrom?: string;
    availableUntil?: string;
    conflicts?: Array<{ checkIn: string; checkOut: string }>;
  }> {
    try {
      const ci = new Date(checkIn);
      const co = new Date(checkOut);
      if (isNaN(ci.getTime()) || isNaN(co.getTime())) {
        return { available: false, message: 'Dates invalides' };
      }
      if (co <= ci) {
        return { available: false, message: 'La date de depart doit etre apres la date d arrivee' };
      }

      // Load all active bookings for this property
      const existing = await this.prisma.resiRequest.findMany({
        where: { type: 'IMMOBILIER' as any, status: { in: ['NEW', 'IN_PROGRESS'] as any[] } },
        select: { data: true },
        orderBy: { createdAt: 'asc' },
      });

      const conflicts: Array<{ checkIn: string; checkOut: string }> = [];

      for (const req of existing) {
        const d = req.data as any;
        if (!d || !d.checkIn || !d.checkOut) continue;
        if (d.propertyId !== propertyId && d.bien !== propertyId) continue;

        const ei = new Date(d.checkIn);
        const eo = new Date(d.checkOut);

        if (ci < eo && co > ei) {
          conflicts.push({ checkIn: d.checkIn, checkOut: d.checkOut });
        }
      }

      if (conflicts.length === 0) {
        return { available: true, message: '✅ Disponible pour ces dates' };
      }

      // Find all booked periods sorted by date
      const allBooked = existing
        .map((r: any) => {
          const d = r.data as any;
          if (!d || !d.checkIn || !d.checkOut) return null;
          if (d.propertyId !== propertyId && d.bien !== propertyId) return null;
          return { checkIn: d.checkIn, checkOut: d.checkOut };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

      // Find next available date after all conflicts
      let latestConflictEnd = new Date(0);
      for (const b of allBooked as any[]) {
        const eo = new Date(b.checkOut);
        if (eo > latestConflictEnd) latestConflictEnd = eo;
      }

      // Add 1 day after last booking ends
      const nextAvailable = new Date(latestConflictEnd);
      nextAvailable.setDate(nextAvailable.getDate() + 1);
      const nextAvailableStr = nextAvailable.toISOString().split('T')[0];

      // Find if there's a gap before the first conflict
      const firstConflict = (allBooked as any[])[0];
      const firstConflictStart = firstConflict ? new Date(firstConflict.checkIn) : null;

      let availableUntil: string | undefined;
      if (firstConflictStart && ci < firstConflictStart) {
        const dayBefore = new Date(firstConflictStart);
        dayBefore.setDate(dayBefore.getDate() - 1);
        availableUntil = dayBefore.toISOString().split('T')[0];
      }

      const conflictDates = conflicts[0];
      let msg = `❌ Non disponible — réservé du ${conflictDates.checkIn} au ${conflictDates.checkOut}.`;
      msg += ` Disponible à partir du ${nextAvailableStr}`;
      if (availableUntil) msg += ` ou disponible jusqu'au ${availableUntil}`;

      return {
        available: false,
        message: msg,
        nextAvailableFrom: nextAvailableStr,
        availableUntil,
        conflicts,
      };
    } catch (e) {
      return { available: true, message: 'Disponible' };
    }
  }

  // ─── ASSISTANT IA — apprentissage supervisé ────────────────

  private normalizeQuestion(q: string): string {
    return (q || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async logUnansweredQuestion(question: string) {
    const norm = this.normalizeQuestion(question);
    if (!norm || norm.length < 3) return { success: true };
    try {
      const existing = await this.prisma.resiAiUnanswered.findFirst({ where: { question: norm } });
      if (existing) {
        await this.prisma.resiAiUnanswered.update({
          where: { id: existing.id },
          data: { count: { increment: 1 }, lastAsked: new Date() },
        });
      } else {
        await this.prisma.resiAiUnanswered.create({ data: { question: norm } });
      }
      return { success: true };
    } catch (e) {
      return { success: true };
    }
  }

  async getUnansweredQuestions() {
    return this.prisma.resiAiUnanswered.findMany({
      orderBy: [{ count: 'desc' }, { lastAsked: 'desc' }],
      take: 50,
    });
  }

  async dismissUnansweredQuestion(id: string) {
    try { await this.prisma.resiAiUnanswered.delete({ where: { id } }); } catch (e) {}
    return { success: true };
  }

  async getAiKnowledge() {
    return this.prisma.resiAiKnowledge.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async teachAiAnswer(keywords: string, answer: string, unansweredId?: string) {
    const kw = (keywords || '').trim();
    const ans = (answer || '').trim();
    if (!kw || !ans) throw new Error('Mots-clés et réponse requis');

    const created = await this.prisma.resiAiKnowledge.create({ data: { keywords: kw, answer: ans } });
    if (unansweredId) {
      try { await this.prisma.resiAiUnanswered.delete({ where: { id: unansweredId } }); } catch (e) {}
    }
    return created;
  }

  async deleteAiKnowledge(id: string) {
    try { await this.prisma.resiAiKnowledge.delete({ where: { id } }); } catch (e) {}
    return { success: true };
  }
}
