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
let OrdersService = class OrdersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        let subtotal = 0;
        const orderItems = [];
        for (const item of dto.items) {
            const product = await this.prisma.product.findUnique({
                where: { id: item.productId },
                include: { variants: true },
            });
            if (!product)
                throw new common_1.BadRequestException(`Produit ${item.productId} introuvable`);
            if (!product.isActive)
                throw new common_1.BadRequestException(`Produit ${product.name} non disponible`);
            let price = Number(product.price);
            let variantName = '';
            if (item.variantId) {
                const variant = product.variants.find(v => v.id === item.variantId);
                if (variant) {
                    price = Number(variant.price);
                    variantName = variant.name;
                }
            }
            const total = price * item.quantity;
            subtotal += total;
            orderItems.push({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price,
                total,
                productName: product.name,
                variantName,
            });
        }
        let discount = 0;
        let couponId = null;
        if (dto.couponCode) {
            const coupon = await this.prisma.coupon.findFirst({
                where: { code: dto.couponCode, isActive: true },
            });
            if (coupon) {
                if (!coupon.expiresAt || coupon.expiresAt > new Date()) {
                    if (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) {
                        discount = coupon.type === 'PERCENTAGE'
                            ? subtotal * (Number(coupon.value) / 100)
                            : Number(coupon.value);
                        couponId = coupon.id;
                    }
                }
            }
        }
        const shippingCost = 0;
        const total = subtotal - discount + shippingCost;
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const order = await this.prisma.order.create({
            data: {
                orderNumber,
                customerName: dto.customerName,
                customerEmail: dto.customerEmail,
                customerPhone: dto.customerPhone,
                shippingAddress: dto.shippingAddress,
                shippingCity: dto.shippingCity,
                shippingCountry: dto.shippingCountry,
                subtotal, shippingCost, discount, total,
                currency: 'XOF',
                customerId: dto.customerId,
                couponId,
                status: 'PENDING',
                items: { create: orderItems },
            },
            include: { items: { include: { product: { include: { images: { take: 1 } } } } } },
        });
        if (couponId) {
            await this.prisma.coupon.update({
                where: { id: couponId },
                data: { usageCount: { increment: 1 } },
            });
        }
        await this.prisma.tracking.create({ data: { orderId: order.id } });
        return order;
    }
    async findAll(query) {
        const { page = 1, limit = 20, status, search } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (search)
            where.OR = [
                { orderNumber: { contains: search } },
                { customerEmail: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
            ];
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where, skip, take: limit,
                include: { items: true, payment: true, tracking: true },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.order.count({ where }),
        ]);
        return { orders, total, page, limit, pages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: { include: { product: { include: { images: { take: 1 } } }, variant: true } },
                payment: true,
                tracking: true,
                customer: true,
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Commande introuvable');
        return order;
    }
    async updateStatus(id, status) {
        return this.prisma.order.update({ where: { id }, data: { status: status } });
    }
    async findByCustomer(customerId, query = {}) {
        const { page = 1, limit = 20 } = query;
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where: { customerId },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    items: { include: { product: { include: { images: { take: 1 } } } } },
                    payment: true,
                    tracking: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.order.count({ where: { customerId } }),
        ]);
        return { orders, total, page, limit, pages: Math.ceil(total / limit) };
    }
    async getDashboardStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalOrders, todayOrders, totalRevenue, pendingOrders] = await Promise.all([
            this.prisma.order.count(),
            this.prisma.order.count({ where: { createdAt: { gte: today } } }),
            this.prisma.order.aggregate({
                where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
                _sum: { total: true },
            }),
            this.prisma.order.count({ where: { status: 'PENDING' } }),
        ]);
        const totalProducts = await this.prisma.product.count({ where: { isActive: true } });
        const totalCustomers = await this.prisma.customer.count();
        return {
            totalOrders,
            todayOrders,
            totalRevenue: totalRevenue._sum.total || 0,
            pendingOrders,
            totalProducts,
            totalCustomers,
        };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map