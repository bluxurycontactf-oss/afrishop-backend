import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

const DEFAULT_CONTENT: Record<string, any> = {
  categories: [], products: [], gallery: [], testimonials: [], blog: [], settings: {},
};

@Injectable()
export class LbsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  // Crée les tables si elles n'existent pas encore (cet environnement ne peut
  // pas lancer `prisma db push` directement contre Supabase — la création se
  // fait donc ici, au démarrage de l'app sur Render, qui a accès à la base).
  async onModuleInit() {
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS lbs_content (
          id TEXT PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          data JSONB NOT NULL,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
        );
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS lbs_admin (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          "passwordHash" TEXT NOT NULL,
          name TEXT NOT NULL DEFAULT 'Admin',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
        );
      `);
    } catch (e) {
      console.warn('[LBS] table init skipped:', e.message);
    }
  }

  // ─── CONTENT ───────────────────────────────────────────────

  async getAllContent(): Promise<Record<string, any>> {
    try {
      const rows = await this.prisma.lbsContent.findMany();
      const result: Record<string, any> = { ...DEFAULT_CONTENT };
      for (const row of rows) result[row.key] = row.data;
      return result;
    } catch (e) {
      console.warn('[LBS] lbs_content table not ready:', e.message);
      return { ...DEFAULT_CONTENT };
    }
  }

  async getContent(key: string): Promise<any> {
    try {
      const row = await this.prisma.lbsContent.findUnique({ where: { key } });
      return row ? row.data : (DEFAULT_CONTENT[key] ?? null);
    } catch (e) {
      console.warn('[LBS] getContent error:', e.message);
      return DEFAULT_CONTENT[key] ?? null;
    }
  }

  async upsertContent(key: string, data: any): Promise<any> {
    try {
      return await this.prisma.lbsContent.upsert({
        where: { key },
        update: { data },
        create: { key, data },
      });
    } catch (e) {
      console.error('[LBS] upsertContent error:', e.message);
      throw new Error('Impossible de sauvegarder — réessayez dans quelques instants');
    }
  }

  async upsertAllContent(payload: Record<string, any>): Promise<void> {
    try {
      await Promise.all(
        Object.keys(payload).map((key) =>
          this.prisma.lbsContent.upsert({
            where: { key },
            update: { data: payload[key] },
            create: { key, data: payload[key] },
          }),
        ),
      );
    } catch (e) {
      console.error('[LBS] upsertAllContent error:', e.message);
      throw new Error('Impossible de sauvegarder — réessayez dans quelques instants');
    }
  }
}
