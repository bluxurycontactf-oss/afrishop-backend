import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: number; limit?: number; search?: string;
    categoryId?: string; featured?: boolean; active?: boolean;
  }) {
    const { page = 1, limit = 20, search, categoryId, featured, active } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { nameEn: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } },
    ];
    if (categoryId) where.categoryId = categoryId;
    if (featured !== undefined) where.isFeatured = featured;
    if (active !== undefined) where.isActive = String(active) === 'true';
    // Si active n'est pas spécifié ET pas de clé admin → seulement actifs

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

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
        category: true,
        reviews: { where: { isApproved: true }, take: 10 },
      },
    });
    if (!product) throw new NotFoundException('Produit introuvable');
    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
        category: true,
        reviews: { where: { isApproved: true } },
      },
    });
    if (!product) throw new NotFoundException('Produit introuvable');
    return product;
  }

  async create(data: any) {
    const slugify = (await import('slugify')).default;
    let slug = slugify(data.name || 'produit', { lower: true, strict: true });
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const { images, ...rest } = data;
    return this.prisma.product.create({
      data: {
        ...rest,
        slug,
        currency: rest.currency || 'XOF',
        isActive: rest.isActive !== undefined ? rest.isActive : true,
        images: images?.length ? {
          create: images.map((url: string, i: number) => ({ url, sortOrder: i })),
        } : undefined,
      },
      include: { images: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.product.update({ where: { id }, data });
  }

  async delete(id: string) {
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
}
