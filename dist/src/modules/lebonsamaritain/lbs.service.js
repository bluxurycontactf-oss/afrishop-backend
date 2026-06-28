"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LbsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const DEFAULT_CONTENT = {
    categories: [], products: [], gallery: [], testimonials: [], blog: [], settings: {},
};
let LbsService = class LbsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
        }
        catch (e) {
            console.warn('[LBS] table init skipped:', e.message);
        }
    }
    async getAllContent() {
        try {
            const rows = await this.prisma.lbsContent.findMany();
            const result = { ...DEFAULT_CONTENT };
            for (const row of rows)
                result[row.key] = row.data;
            return result;
        }
        catch (e) {
            console.warn('[LBS] lbs_content table not ready:', e.message);
            return { ...DEFAULT_CONTENT };
        }
    }
    async getContent(key) {
        try {
            const row = await this.prisma.lbsContent.findUnique({ where: { key } });
            return row ? row.data : (DEFAULT_CONTENT[key] ?? null);
        }
        catch (e) {
            console.warn('[LBS] getContent error:', e.message);
            return DEFAULT_CONTENT[key] ?? null;
        }
    }
    async upsertContent(key, data) {
        try {
            return await this.prisma.lbsContent.upsert({
                where: { key },
                update: { data },
                create: { key, data },
            });
        }
        catch (e) {
            console.error('[LBS] upsertContent error:', e.message);
            throw new Error('Impossible de sauvegarder — réessayez dans quelques instants');
        }
    }
    async upsertAllContent(payload) {
        try {
            await Promise.all(Object.keys(payload).map((key) => this.prisma.lbsContent.upsert({
                where: { key },
                update: { data: payload[key] },
                create: { key, data: payload[key] },
            })));
        }
        catch (e) {
            console.error('[LBS] upsertAllContent error:', e.message);
            throw new Error('Impossible de sauvegarder — réessayez dans quelques instants');
        }
    }
};
exports.LbsService = LbsService;
exports.LbsService = LbsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LbsService);
//# sourceMappingURL=lbs.service.js.map