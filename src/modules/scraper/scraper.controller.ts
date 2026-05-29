import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ScraperService } from './scraper.service';
import { AdminKeyGuard } from '../../common/guards/admin-key.guard';

@ApiTags('Scraper AliExpress')
@Controller('products')
export class ScraperController {
  constructor(private scraper: ScraperService) {}

  @Post('import')
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Importer un produit depuis un lien AliExpress' })
  importProduct(@Body() dto: { url: string; categoryId?: string; markup?: number }) {
    return this.scraper.importProduct(dto.url, dto.categoryId, dto.markup ?? 30);
  }

  @Post('preview')
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Prévisualiser un produit AliExpress sans sauvegarder' })
  previewProduct(@Body() dto: { url: string }) {
    return this.scraper.scrapeProduct(dto.url);
  }
}
