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
var PriceSyncProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceSyncProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const scraper_service_1 = require("../../scraper/scraper.service");
const prisma_service_1 = require("../../../config/prisma.service");
let PriceSyncProcessor = PriceSyncProcessor_1 = class PriceSyncProcessor {
    constructor(scraper, prisma) {
        this.scraper = scraper;
        this.prisma = prisma;
        this.logger = new common_1.Logger(PriceSyncProcessor_1.name);
    }
    async handlePriceSync(job) {
        if (job.data.productId) {
            await this.scraper.syncProductPrice(job.data.productId);
        }
        else {
            const products = await this.prisma.product.findMany({
                where: { aliexpressUrl: { not: null } },
                select: { id: true, name: true },
            });
            this.logger.log(`🔄 Sync prix pour ${products.length} produits`);
            for (const p of products) {
                await this.scraper.syncProductPrice(p.id);
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }
};
exports.PriceSyncProcessor = PriceSyncProcessor;
__decorate([
    (0, bull_1.Process)('sync-prices'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PriceSyncProcessor.prototype, "handlePriceSync", null);
exports.PriceSyncProcessor = PriceSyncProcessor = PriceSyncProcessor_1 = __decorate([
    (0, bull_1.Processor)('price-sync'),
    __metadata("design:paramtypes", [scraper_service_1.ScraperService, prisma_service_1.PrismaService])
], PriceSyncProcessor);
//# sourceMappingURL=price-sync.processor.js.map