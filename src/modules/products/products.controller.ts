import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { AdminKeyGuard } from '../../common/guards/admin-key.guard';

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
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Créer un produit' })
  create(@Body() body: any) {
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
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Mettre à jour un produit' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.products.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Supprimer un produit' })
  delete(@Param('id') id: string) {
    return this.products.delete(id);
  }
}
