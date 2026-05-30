import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminKeyGuard } from '../../common/guards/admin-key.guard';
import { CategoriesService } from './categories.service';

@ApiTags('Catégories')
@Controller('categories')
export class CategoriesController {
  constructor(private categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les catégories (public)' })
  findAll() { return this.categories.findAll(); }

  @Post()
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Créer une catégorie (admin)' })
  create(@Body() dto: any) { return this.categories.create(dto); }

  @Put(':id')
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Modifier une catégorie (admin)' })
  update(@Param('id') id: string, @Body() dto: any) { return this.categories.update(id, dto); }

  @Delete(':id')
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Supprimer une catégorie (admin)' })
  delete(@Param('id') id: string) { return this.categories.delete(id); }
}
