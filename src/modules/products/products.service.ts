import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any = {}) {
    const page  = Math.max(1, parseInt(query.page)  || 1);
    const limit = Math.min(200, parseInt(query.limit) || 20);
    const skip  = (page - 1) * limit;
    const { search, categoryId } = query;

    const where: any = {};
    if (search)     where.name = { contains: search, mode: 'insensitive' };
    if (categoryId) where.categoryId = categoryId;
    if (query.featured !== undefined) where.isFeatured = query.featured === 'true' || query.featured === true;
    if (query.active !== undefined)   where.isActive   = query.active   === 'true' || query.active   === true;

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
