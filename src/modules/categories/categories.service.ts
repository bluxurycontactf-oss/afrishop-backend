import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import slugify from 'slugify';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: { children: { where: { isActive: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(data: any) {
    // Générer le slug automatiquement si non fourni
    let slug = data.slug?.trim() || slugify(data.name || 'categorie', { lower: true, strict: true });
    // S'assurer que le slug est unique
    const existing = await this.prisma.category.findFirst({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    return this.prisma.category.create({
      data: {
        name:      data.name,
        nameEn:    data.nameEn    || null,
        slug,
        description: data.description || null,
        image:     data.image     || null,
        parentId:  data.parentId  || null,
        isActive:  data.isActive  !== false,
        sortOrder: data.sortOrder || 0,
      },
    });
  }

  async update(id: string, data: any) {
    const updateData: any = {};
    if (data.name !== undefined)        updateData.name        = data.name;
    if (data.nameEn !== undefined)      updateData.nameEn      = data.nameEn;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.image !== undefined)       updateData.image       = data.image;
    if (data.isActive !== undefined)    updateData.isActive    = data.isActive;
    if (data.sortOrder !== undefined)   updateData.sortOrder   = data.sortOrder;
    if (data.slug?.trim()) {
      updateData.slug = data.slug.trim();
    } else if (data.name) {
      updateData.slug = slugify(data.name, { lower: true, strict: true });
    }
    return this.prisma.category.update({ where: { id }, data: updateData });
  }

  async delete(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
