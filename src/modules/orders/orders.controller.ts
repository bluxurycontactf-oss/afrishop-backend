import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { AdminKeyGuard } from '../../common/guards/admin-key.guard';
import { CustomerJwtGuard } from '../auth/customer-jwt.guard';
import { NotificationsService } from '../notifications/notifications.service';

@ApiTags('Commandes')
@Controller('orders')
export class OrdersController {
  constructor(
    private orders: OrdersService,
    private notifications: NotificationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer une commande' })
  create(@Body() dto: any) {
    return this.orders.create(dto);
  }

  @Get('by-phone/:phone')
  @ApiOperation({ summary: 'Chercher commandes par numéro de téléphone' })
  findByPhone(@Param('phone') phone: string) {
    return this.orders.findByPhone(phone);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail commande par ID ou numéro' })
  findOne(@Param('id') id: string) {
    return this.orders.findOne(id);
  }

  @Get('my/orders')
  @UseGuards(CustomerJwtGuard)
  @ApiOperation({ summary: 'Mes commandes (client connecté)' })
  getMyOrders(@Request() req: any, @Query() query: any) {
    return this.orders.findByCustomer(req.user.id, query);
  }

  @Get()
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Liste toutes les commandes (admin)' })
  findAll(@Query() query: any) {
    return this.orders.findAll(query);
  }

  @Get('stats/dashboard')
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Stats dashboard (admin)' })
  getStats() {
    return this.orders.getDashboardStats();
  }

  @Put(':id/status')
  @UseGuards(AdminKeyGuard)
  @ApiOperation({ summary: 'Mettre à jour le statut + notifier le client (admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; trackingNumber?: string },
  ) {
    const order = await this.orders.updateStatus(id, body.status);

    // Envoyer email de notification au client automatiquement
    if (order && order.customerEmail) {
      this.notifications.sendOrderStatusUpdate(
        order.customerEmail,
        order.orderNumber,
        body.status,
        body.trackingNumber,
      ).catch(() => {});
    }

    return order;
  }
}
