import { Controller, Post, Body, UseGuards, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScraperService } from './scraper.service';
import { IsString, IsUrl, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const ADMIN_KEY = process.env.ADMIN_API_KEY || 'afrishop-admin-2024';

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
@Controller('products')
export class ScraperController {
  constructor(private scraper: ScraperService) {}

  @Post('import')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Importer un produit depuis un lien AliExpress' })
  importProduct(@Body() dto: ImportProductDto) {
    return this.scraper.importProduct(dto.url, dto.categoryId, dto.markup ?? 30);
  }

  @Post('preview')
  @ApiOperation({ summary: 'Prévisualiser un produit AliExpress sans sauvegarder' })
  previewProduct(
    @Body() dto: { url: string },
    @Headers('x-admin-key') key: string,
  ) {
    if (key !== ADMIN_KEY) throw new UnauthorizedException('Clé admin invalide');
    return this.scraper.scrapeProduct(dto.url);
  }
}
