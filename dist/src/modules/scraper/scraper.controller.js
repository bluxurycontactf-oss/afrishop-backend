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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const scraper_service_1 = require("./scraper.service");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'afrishop-admin-2024';
class ImportProductDto {
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'https://fr.aliexpress.com/item/1005006...' }),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], ImportProductDto.prototype, "url", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportProductDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ required: false, example: 30, description: 'Marge en %' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(500),
    __metadata("design:type", Number)
], ImportProductDto.prototype, "markup", void 0);
let ScraperController = class ScraperController {
    constructor(scraper) {
        this.scraper = scraper;
    }
    importProduct(dto) {
        return this.scraper.importProduct(dto.url, dto.categoryId, dto.markup ?? 30);
    }
    previewProduct(dto, key) {
        if (key !== ADMIN_KEY)
            throw new common_1.UnauthorizedException('Clé admin invalide');
        return this.scraper.scrapeProduct(dto.url);
    }
};
exports.ScraperController = ScraperController;
__decorate([
    (0, common_1.Post)('import'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiOperation)({ summary: 'Importer un produit depuis un lien AliExpress' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ImportProductDto]),
    __metadata("design:returntype", void 0)
], ScraperController.prototype, "importProduct", null);
__decorate([
    (0, common_1.Post)('preview'),
    (0, swagger_1.ApiOperation)({ summary: 'Prévisualiser un produit AliExpress sans sauvegarder' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-admin-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ScraperController.prototype, "previewProduct", null);
exports.ScraperController = ScraperController = __decorate([
    (0, swagger_1.ApiTags)('Scraper AliExpress'),
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [scraper_service_1.ScraperService])
], ScraperController);
//# sourceMappingURL=scraper.controller.js.map