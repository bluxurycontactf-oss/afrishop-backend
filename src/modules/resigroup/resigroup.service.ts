import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

const DEFAULT_CONTENT: Record<string, any[]> = {
  immo: [],
  vols: [],
  cars: [],
  liv: [],
  restos: [],
  svcs: [],
  streaming: [],
  settings: [],
};

@Injectable()
export class ResiGroupService {
  constructor(private prisma: PrismaService) {}

  // ─── CONTENT ───────────────────────────────────────────────

  async getAllContent(): Promise<Record<string, any>> {
    const rows = await this.prisma.resiContent.findMany();
    const result: Record<string, any> = {};
    for (const row of rows) {
      result[row.key] = row.data;
    }
    // Fill missing keys with empty defaults
    for (const key of Object.keys(DEFAULT_CONTENT)) {
      if (!(key in result)) result[key] = DEFAULT_CONTENT[key];
    }
    return result;
  }

  async getContent(key: string): Promise<any> {
    const row = await this.prisma.resiContent.findUnique({ where: { key } });
    return row ? row.data : DEFAULT_CONTENT[key] ?? null;
  }

  async upsertContent(key: string, data: any): Promise<any> {
    const row = await this.prisma.resiContent.upsert({
      where: { key },
      update: { data },
      create: { key, data },
    });
    return row;
  }

  async upsertAllContent(payload: Record<string, any>): Promise<void> {
    const keys = Object.keys(payload);
    await Promise.all(
      keys.map(key =>
        this.prisma.resiContent.upsert({
          where: { key },
          update: { data: payload[key] },
          create: { key, data: payload[key] },
        }),
      ),
    );
  }

  // ─── REQUESTS ──────────────────────────────────────────────

  async createRequest(dto: {
    type: any;
    name: string;
    phone: string;
    email?: string;
    subject?: string;
    message?: string;
    data?: any;
  }) {
    return this.prisma.resiRequest.create({ data: dto });
  }

  async getAllRequests(type?: string, status?: string) {
    return this.prisma.resiRequest.findMany({
      where: {
        ...(type && { type: type as any }),
        ...(status && { status: status as any }),
      },
      orderBy: { createdAt: 'desc' },
    });
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
    const [total, newCount, inProgress, done] = await Promise.all([
      this.prisma.resiRequest.count(),
      this.prisma.resiRequest.count({ where: { status: 'NEW' } }),
      this.prisma.resiRequest.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.resiRequest.count({ where: { status: 'DONE' } }),
    ]);
    return { total, new: newCount, inProgress, done };
  }
}
