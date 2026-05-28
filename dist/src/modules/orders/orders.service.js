"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const normalizeStatus = (s) => {
    const map = {
        confirmed: 'PAID', paid: 'PAID',
        processing: 'PROCESSING',
        shipped: 'SHIPPED',
        delivered: 'DELIVERED',
        cancelled: 'CANCELLED', canceled: 'CANCELLED',
        pending: 'PENDING',
    };
    return map[s?.toLowerCase()] || s?.toUpperCase() || 'PENDING';
};
let OrdersService = class OrdersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        let subtotal = 0;
        const orderItems = [];
        for (const item of dto.items) {
            const qty = item.quantity || item.qty || 1;
            let price = Number(item.price) || 0;
            let productName = item.productName || 'Produit';
            let productId = null;
            if (item.productId && /^[0-9a-f-]{36}$/i.test(item.productId)) {
                try {
                    const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
                    if (product) {
                        productId = product.id;
                        productName = product.name;
                        if (!price)
                            price = Number(product.price);
                    }
                }
                catch { }
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
                customerName: dto.customerName || dto.customerPhone,
                customerEmail: dto.customerEmail || null,
                customerPhone: dto.customerPhone,
                shippingAddress: dto.shippingAddress || dto.shippingCity || '',
                shippingCity: dto.shippingCity || dto.shippingCountry || '',
                shippingCountry: dto.shippingCountry || 'CI',
                subtotal, shippingCost: 0, discount: 0, total,
                currency: 'XOF',
                customerId: dto.customerId || null,
                status: normalizeStatus(dto.fedaStatus || 'confirmed'),
                items: { create: orderItems },
            },
            include: { items: true },
        });
        try {
            await this.prisma.tracking.create({ data: { orderId: order.id } });
        }
        catch { }
        return order;
    }
    async findAll(query) {
        const { page = 1, limit = 20, status, search } = query;
        const skip = (page - 1) * Number(limit);
        const where = {};
        if (status)
            where.status = normalizeStatus(status);
        if (search)
            where.OR = [
                { orderNumber: { contains: search } },
                { customerEmail: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
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
    async findOne(id) {
        const order = await this.prisma.order.findFirst({
            where: { OR: [{ id }, { orderNumber: id }] },
            include: { items: true, tracking: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Commande introuvable');
        return order;
    }
    async updateStatus(id, status) {
        return this.prisma.order.update({
            where: { id },
            data: { status: normalizeStatus(status) },
        });
    }
    async findByCustomer(customerId, query = {}) {
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
    async findByPhone(phone) {
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
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map