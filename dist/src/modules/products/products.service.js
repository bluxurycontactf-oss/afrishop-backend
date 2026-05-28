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
    async findAll(query = {}) {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(200, parseInt(query.limit) || 20);
        const skip = (page - 1) * limit;
        const { search, categoryId } = query;
        const where = {};
        if (search)
            where.name = { contains: search, mode: 'insensitive' };
        if (categoryId)
            where.categoryId = categoryId;
        if (query.featured !== undefined)
            where.isFeatured = query.featured === 'true' || query.featured === true;
        if (query.active !== undefined)
            where.isActive = query.active === 'true' || query.active === true;
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where, skip, take: limit,
                include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
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
    async create(data) {
        const slugify = (await Promise.resolve().then(() => require('slugify'))).default;
        let slug = slugify(data.name || 'produit', { lower: true, strict: true });
        const existing = await this.prisma.product.findUnique({ where: { slug } });
        if (existing)
            slug = `${slug}-${Date.now()}`;
        const { images, ...rest } = data;
        return this.prisma.product.create({
            data: {
                ...rest,
                slug,
                currency: rest.currency || 'XOF',
                isActive: rest.isActive !== undefined ? rest.isActive : true,
                images: images?.length ? {
                    create: images.map((url, i) => ({ url, sortOrder: i })),
                } : undefined,
            },
            include: { images: true },
        });
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