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
var ImportProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const scraper_service_1 = require("../../scraper/scraper.service");
let ImportProcessor = ImportProcessor_1 = class ImportProcessor {
    constructor(scraper) {
        this.scraper = scraper;
        this.logger = new common_1.Logger(ImportProcessor_1.name);
    }
    async handleImport(job) {
        const { url, categoryId, markup } = job.data;
        this.logger.log(`📦 Worker: Import ${url}`);
        try {
            const product = await this.scraper.importProduct(url, categoryId, markup ?? 30);
            this.logger.log(`✅ Importé : ${product.name}`);
            return product;
        }
        catch (error) {
            this.logger.error(`❌ Import échoué : ${error.message}`);
            throw error;
        }
    }
};
exports.ImportProcessor = ImportProcessor;
__decorate([
    (0, bull_1.Process)('import-product'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ImportProcessor.prototype, "handleImport", null);
exports.ImportProcessor = ImportProcessor = ImportProcessor_1 = __decorate([
    (0, bull_1.Processor)('import'),
    __metadata("design:paramtypes", [scraper_service_1.ScraperService])
], ImportProcessor);
//# sourceMappingURL=import.processor.js.map