import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('Produits')
@Controller('products')
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des produits (public)' })
  findAll(@Query() query: any) {
    return this.products.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un produit manuellement' })
  create(@Body() body: any, @Headers('x-admin-key') key: string) {
    const ADMIN_KEY = process.env.ADMIN_API_KEY || 'afrishop-admin-2024';
    if (key !== ADMIN_KEY) throw new UnauthorizedException('Clé admin invalide');
    return this.products.create(body);
  }

  @Get('featured')
  getFeatured(@Query('limit') limit?: string) {
    return this.products.getFeatured(limit ? parseInt(limit) : 8);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.products.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.products.findBySlug(slug);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un produit' })
  update(@Param('id') id: string, @Body() body: any, @Headers('x-admin-key') key: string) {
    const ADMIN_KEY = process.env.ADMIN_API_KEY || 'afrishop-admin-2024';
    if (key !== ADMIN_KEY) throw new UnauthorizedException('Clé admin invalide');
    return this.products.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un produit' })
  delete(@Param('id') id: string, @Headers('x-admin-key') key: string) {
    const ADMIN_KEY = process.env.ADMIN_API_KEY || 'afrishop-admin-2024';
    if (key !== ADMIN_KEY) throw new UnauthorizedException('Clé admin invalide');
    return this.products.delete(id);
  }
}
