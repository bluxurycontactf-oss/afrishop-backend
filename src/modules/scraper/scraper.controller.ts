import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScraperService } from './scraper.service';
import { IsString, IsUrl, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class ImportProductDto {
  @ApiProperty({ example: 'https://fr.aliexpress.com/item/1005006...' })
  @IsUrl()
  url: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  categoryId?: string;

  @ApiProperty({ required: false, example: 30, description: 'Marge en %' })
  @IsOptional() @IsNumber() @Min(0) @Max(500)
  markup?: number;
}

@ApiTags('Scraper AliExpress')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('products')
export class ScraperController {
  constructor(private scraper: ScraperService) {}

  @Post('import')
  @ApiOperation({ summary: 'Importer un produit depuis un lien AliExpress' })
  importProduct(@Body() dto: ImportProductDto) {
    return this.scraper.importProduct(dto.url, dto.categoryId, dto.markup ?? 30);
  }

  @Post('preview')
  @ApiOperation({ summary: 'Prévisualiser un produit AliExpress sans importer' })
  previewProduct(@Body() dto: { url: string }) {
    return this.scraper.scrapeProduct(dto.url);
  }
}
