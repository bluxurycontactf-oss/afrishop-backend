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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let ProductsService = class ProductsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const { page = 1, limit = 20, search, categoryId, featured, active } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (search)
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { nameEn: { contains: search, mode: 'insensitive' } },
                { tags: { has: search } },
            ];
        if (categoryId)
            where.categoryId = categoryId;
        if (featured !== undefined)
            where.isFeatured = featured;
        if (active !== undefined)
            where.isActive = active;
        else
            where.isActive = true;
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where, skip, take: limit,
                include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: true },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.product.count({ where }),
        ]);
        return { products, total, page, limit, pages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                images: { orderBy: { sortOrder: 'asc' } },
                variants: true,
                category: true,
                reviews: { where: { isApproved: true }, take: 10 },
            },
        });
        if (!product)
            throw new common_1.NotFoundException('Produit introuvable');
        return product;
    }
    async findBySlug(slug) {
        const product = await this.prisma.product.findUnique({
            where: { slug },
            include: {
                images: { orderBy: { sortOrder: 'asc' } },
                variants: true,
                category: true,
                reviews: { where: { isApproved: true } },
            },
        });
        if (!product)
            throw new common_1.NotFoundException('Produit introuvable');
        return product;
    }
    async update(id, data) {
        return this.prisma.product.update({ where: { id }, data });
    }
    async delete(id) {
        return this.prisma.product.delete({ where: { id } });
    }
    async getFeatured(limit = 8) {
        return this.prisma.product.findMany({
            where: { isFeatured: true, isActive: true },
            include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map