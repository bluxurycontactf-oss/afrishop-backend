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
exports.ResiGroupService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const DEFAULT_CONTENT = {
    immo: [], vols: [], cars: [], liv: [],
    restos: [], svcs: [], streaming: [], settings: {},
};
let ResiGroupService = class ResiGroupService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllContent() {
        try {
            const rows = await this.prisma.resiContent.findMany();
            const result = { ...DEFAULT_CONTENT };
            for (const row of rows) {
                result[row.key] = row.data;
            }
            return result;
        }
        catch (e) {
            console.warn('[ResiGroup] resi_content table not ready:', e.message);
            return { ...DEFAULT_CONTENT };
        }
    }
    async getContent(key) {
        try {
            const row = await this.prisma.resiContent.findUnique({ where: { key } });
            return row ? row.data : (DEFAULT_CONTENT[key] ?? null);
        }
        catch (e) {
            console.warn('[ResiGroup] getContent error:', e.message);
            return DEFAULT_CONTENT[key] ?? null;
        }
    }
    async upsertContent(key, data) {
        try {
            return await this.prisma.resiContent.upsert({
                where: { key },
                update: { data },
                create: { key, data },
            });
        }
        catch (e) {
            console.error('[ResiGroup] upsertContent error:', e.message);
            throw new Error('Impossible de sauvegarder — tables non créées dans Supabase');
        }
    }
    async upsertAllContent(payload) {
        try {
            await Promise.all(Object.keys(payload).map(key => this.prisma.resiContent.upsert({
                where: { key },
                update: { data: payload[key] },
                create: { key, data: payload[key] },
            })));
        }
        catch (e) {
            console.error('[ResiGroup] upsertAllContent error:', e.message);
            throw new Error('Impossible de sauvegarder — tables non créées dans Supabase');
        }
    }
    async createRequest(dto) {
        try {
            return await this.prisma.resiRequest.create({ data: dto });
        }
        catch (e) {
            console.error('[ResiGroup] createRequest error:', e.message);
            throw new Error('Impossible d\'enregistrer la demande — tables non créées');
        }
    }
    async getAllRequests(type, status) {
        try {
            return await this.prisma.resiRequest.findMany({
                where: {
                    ...(type && { type: type }),
                    ...(status && { status: status }),
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        catch (e) {
            console.warn('[ResiGroup] getAllRequests error:', e.message);
            return [];
        }
    }
    async updateRequestStatus(id, status) {
        const req = await this.prisma.resiRequest.findUnique({ where: { id } });
        if (!req)
            throw new common_1.NotFoundException('Demande introuvable');
        return this.prisma.resiRequest.update({
            where: { id },
            data: { status: status },
        });
    }
    async deleteRequest(id) {
        const req = await this.prisma.resiRequest.findUnique({ where: { id } });
        if (!req)
            throw new common_1.NotFoundException('Demande introuvable');
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
        }
        catch (e) {
            return { total: 0, new: 0, inProgress: 0, done: 0 };
        }
    }
    async checkAvailability(propertyId, checkIn, checkOut) {
        try {
            const ci = new Date(checkIn);
            const co = new Date(checkOut);
            if (isNaN(ci.getTime()) || isNaN(co.getTime())) {
                return { available: false, message: 'Dates invalides' };
            }
            if (co <= ci) {
                return { available: false, message: 'La date de depart doit etre apres la date d arrivee' };
            }
            const existing = await this.prisma.resiRequest.findMany({
                where: { type: 'IMMOBILIER', status: { in: ['NEW', 'IN_PROGRESS'] } },
                select: { data: true },
                orderBy: { createdAt: 'asc' },
            });
            const conflicts = [];
            for (const req of existing) {
                const d = req.data;
                if (!d || !d.checkIn || !d.checkOut)
                    continue;
                if (d.propertyId !== propertyId && d.bien !== propertyId)
                    continue;
                const ei = new Date(d.checkIn);
                const eo = new Date(d.checkOut);
                if (ci < eo && co > ei) {
                    conflicts.push({ checkIn: d.checkIn, checkOut: d.checkOut });
                }
            }
            if (conflicts.length === 0) {
                return { available: true, message: '✅ Disponible pour ces dates' };
            }
            const allBooked = existing
                .map((r) => {
                const d = r.data;
                if (!d || !d.checkIn || !d.checkOut)
                    return null;
                if (d.propertyId !== propertyId && d.bien !== propertyId)
                    return null;
                return { checkIn: d.checkIn, checkOut: d.checkOut };
            })
                .filter(Boolean)
                .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
            let latestConflictEnd = new Date(0);
            for (const b of allBooked) {
                const eo = new Date(b.checkOut);
                if (eo > latestConflictEnd)
                    latestConflictEnd = eo;
            }
            const nextAvailable = new Date(latestConflictEnd);
            nextAvailable.setDate(nextAvailable.getDate() + 1);
            const nextAvailableStr = nextAvailable.toISOString().split('T')[0];
            const firstConflict = allBooked[0];
            const firstConflictStart = firstConflict ? new Date(firstConflict.checkIn) : null;
            let availableUntil;
            if (firstConflictStart && ci < firstConflictStart) {
                const dayBefore = new Date(firstConflictStart);
                dayBefore.setDate(dayBefore.getDate() - 1);
                availableUntil = dayBefore.toISOString().split('T')[0];
            }
            const conflictDates = conflicts[0];
            let msg = `❌ Non disponible — réservé du ${conflictDates.checkIn} au ${conflictDates.checkOut}.`;
            msg += ` Disponible à partir du ${nextAvailableStr}`;
            if (availableUntil)
                msg += ` ou disponible jusqu'au ${availableUntil}`;
            return {
                available: false,
                message: msg,
                nextAvailableFrom: nextAvailableStr,
                availableUntil,
                conflicts,
            };
        }
        catch (e) {
            return { available: true, message: 'Disponible' };
        }
    }
    normalizeQuestion(q) {
        return (q || '')
            .toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9 ]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    async logUnansweredQuestion(question) {
        const norm = this.normalizeQuestion(question);
        if (!norm || norm.length < 3)
            return { success: true };
        try {
            const existing = await this.prisma.resiAiUnanswered.findFirst({ where: { question: norm } });
            if (existing) {
                await this.prisma.resiAiUnanswered.update({
                    where: { id: existing.id },
                    data: { count: { increment: 1 }, lastAsked: new Date() },
                });
            }
            else {
                await this.prisma.resiAiUnanswered.create({ data: { question: norm } });
            }
            return { success: true };
        }
        catch (e) {
            return { success: true };
        }
    }
    async getUnansweredQuestions() {
        return this.prisma.resiAiUnanswered.findMany({
            orderBy: [{ count: 'desc' }, { lastAsked: 'desc' }],
            take: 50,
        });
    }
    async dismissUnansweredQuestion(id) {
        try {
            await this.prisma.resiAiUnanswered.delete({ where: { id } });
        }
        catch (e) { }
        return { success: true };
    }
    async getAiKnowledge() {
        return this.prisma.resiAiKnowledge.findMany({ orderBy: { createdAt: 'desc' } });
    }
    async teachAiAnswer(keywords, answer, unansweredId) {
        const kw = (keywords || '').trim();
        const ans = (answer || '').trim();
        if (!kw || !ans)
            throw new Error('Mots-clés et réponse requis');
        const created = await this.prisma.resiAiKnowledge.create({ data: { keywords: kw, answer: ans } });
        if (unansweredId) {
            try {
                await this.prisma.resiAiUnanswered.delete({ where: { id: unansweredId } });
            }
            catch (e) { }
        }
        return created;
    }
    async deleteAiKnowledge(id) {
        try {
            await this.prisma.resiAiKnowledge.delete({ where: { id } });
        }
        catch (e) { }
        return { success: true };
    }
};
exports.ResiGroupService = ResiGroupService;
exports.ResiGroupService = ResiGroupService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResiGroupService);
//# sourceMappingURL=resigroup.service.js.map