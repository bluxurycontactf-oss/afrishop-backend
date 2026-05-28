import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CustomerJwtGuard } from '../auth/customer-jwt.guard';

@ApiTags('Commandes')
@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  /* ── PUBLIC ── */
  @Post()
  @ApiOperation({ summary: 'Créer une commande' })
  create(@Body() dto: any) {
    return this.orders.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail commande par ID' })
  findOne(@Param('id') id: string) {
    return this.orders.findOne(id);
  }

  /* ── CLIENT CONNECTÉ ── */
  @Get('my/orders')
  @ApiBearerAuth()
  @UseGuards(CustomerJwtGuard)
  @ApiOperation({ summary: 'Mes commandes (client connecté)' })
  getMyOrders(@Request() req: any, @Query() query: any) {
    return this.orders.findByCustomer(req.user.id, query);
  }

  /* ── ADMIN ── */
  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Liste toutes les commandes (admin)' })
  findAll(@Query() query: any) {
    return this.orders.findAll(query);
  }

  @Get('stats/dashboard')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Stats dashboard (admin)' })
  getStats() {
    return this.orders.getDashboardStats();
  }

  @Put(':id/status')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Mettre à jour le statut (admin)' })
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.orders.updateStatus(id, body.status);
  }
}
