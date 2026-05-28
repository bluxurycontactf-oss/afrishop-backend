import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('Catégories')
@Controller('categories')
export class CategoriesController {
  constructor(private categories: CategoriesService) {}
  @Get() findAll() { return this.categories.findAll(); }
  @Post() @UseGuards(AuthGuard('jwt')) create(@Body() dto: any) { return this.categories.create(dto); }
}
