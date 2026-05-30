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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const slugify_1 = require("slugify");
let CategoriesService = class CategoriesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.category.findMany({
            where: { parentId: null, isActive: true },
            include: { children: { where: { isActive: true } } },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async create(data) {
        let slug = data.slug?.trim() || (0, slugify_1.default)(data.name || 'categorie', { lower: true, strict: true });
        const existing = await this.prisma.category.findFirst({ where: { slug } });
        if (existing)
            slug = `${slug}-${Date.now()}`;
        return this.prisma.category.create({
            data: {
                name: data.name,
                nameEn: data.nameEn || null,
                slug,
                description: data.description || null,
                image: data.image || null,
                parentId: data.parentId || null,
                isActive: data.isActive !== false,
                sortOrder: data.sortOrder || 0,
            },
        });
    }
    async update(id, data) {
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.nameEn !== undefined)
            updateData.nameEn = data.nameEn;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.image !== undefined)
            updateData.image = data.image;
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        if (data.sortOrder !== undefined)
            updateData.sortOrder = data.sortOrder;
        if (data.slug?.trim()) {
            updateData.slug = data.slug.trim();
        }
        else if (data.name) {
            updateData.slug = (0, slugify_1.default)(data.name, { lower: true, strict: true });
        }
        return this.prisma.category.update({ where: { id }, data: updateData });
    }
    async delete(id) {
        return this.prisma.category.delete({ where: { id } });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map