import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

// Normalise les statuts frontend (lowercase) → backend (UPPERCASE)
const normalizeStatus = (s: string): string => {
  const map: Record<string, string> = {
    confirmed: 'PAID', paid: 'PAID',
    processing: 'PROCESSING',
    shipped: 'SHIPPED',
    delivered: 'DELIVERED',
    cancelled: 'CANCELLED', canceled: 'CANCELLED',
    pending: 'PENDING',
  };
  return map[s?.toLowerCase()] || s?.toUpperCase() || 'PENDING';
};

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: {
    customerName?: string;
    customerEmail?: string;
    customerPhone: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingCountry?: string;
    items: {
      productId?: string;
      productName?: string;
      quantity?: number;
      qty?: number;
      price?: number;
      variantId?: string;
    }[];
    fedaPayId?: string;
    fedaStatus?: string;
    payMethod?: string;
    orderRef?: string;
    couponCode?: string;
    customerId?: string;
  }) {
    let subtotal = 0;
    const orderItems = [];

    for (const item of dto.items) {
      const qty = item.quantity || item.qty || 1;
      let price = Number(item.price) || 0;
      let productName = item.productName || 'Produit';
      let productId: string | null = null;

      // Chercher le produit en base si l'ID est fourni et valide (UUID)
      if (item.productId && /^[0-9a-f-]{36}$/i.test(item.productId)) {
        try {
          const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
          if (product) {
            productId = product.id;
            productName = product.name;
            if (!price) price = Number(product.price);
          }
        } catch { /* produit non trouvé, utiliser les infos fournies */ }
      }

      const total = price * qty;
      subtotal += total;
      orderItems.push({
        productId,
        variantId: item.variantId || null,
        quantity: qty,
        price,
        total,
        productName,
        variantName: '',
      });
    }

    const total = subtotal;
    const orderNumber = dto.orderRef || `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerName:    dto.customerName    || dto.customerPhone,
        customerEmail:   dto.customerEmail   || null,
        customerPhone:   dto.customerPhone,
        shippingAddress: dto.shippingAddress || dto.shippingCity || '',
        shippingCity:    dto.shippingCity    || dto.shippingCountry || '',
        shippingCountry: dto.shippingCountry || 'CI',
        subtotal, shippingCost: 0, discount: 0, total,
        currency: 'XOF',
        customerId: dto.customerId || null,
        status: normalizeStatus(dto.fedaStatus || 'confirmed') as any,
        items: { create: orderItems },
      },
      include: { items: true },
    });

    // Créer le tracking
    try {
      await this.prisma.tracking.create({ data: { orderId: order.id } });
    } catch { /* ignore si déjà créé */ }

    return order;
  }

  async findAll(query: { page?: number; limit?: number; status?: string; search?: string }) {
    const { page = 1, limit = 20, status, search } = query;
    const skip = (page - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = normalizeStatus(status);
    if (search) where.OR = [
      { orderNumber: { contains: search } },
      { customerEmail: { contains: search, mode: 'insensitive' } },
      { customerName:  { contains: search, mode: 'insensitive' } },
      { customerPhone: { contains: search } },
    ];

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where, skip, take: Number(limit),
        include: { items: true, tracking: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { orders, total, page, limit, pages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: { items: true, tracking: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    return order;
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.order.update({
      where: { id },
      data: { status: normalizeStatus(status) as any },
    });
  }

  async findByCustomer(customerId: string, query: any = {}) {
    const { page = 1, limit = 20 } = query;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { customerId },
        skip: (page - 1) * Number(limit),
        take: Number(limit),
        include: { items: true, tracking: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where: { customerId } }),
    ]);
    return { orders, total, page, limit, pages: Math.ceil(total / Number(limit)) };
  }

  async findByPhone(phone: string) {
    return this.prisma.order.findMany({
      where: { customerPhone: { contains: phone.replace(/\D/g, '').slice(-8) } },
      include: { items: true, tracking: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalOrders, todayOrders, revenue, pendingOrders, totalProducts, totalCustomers] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.order.aggregate({
        where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
        _sum: { total: true },
      }),
      this.prisma.order.count({ where: { status: { in: ['PENDING', 'PAID'] } } }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.customer.count(),
    ]);
    return {
      totalOrders, todayOrders,
      totalRevenue: revenue._sum.total || 0,
      pendingOrders, totalProducts, totalCustomers,
    };
  }
}
