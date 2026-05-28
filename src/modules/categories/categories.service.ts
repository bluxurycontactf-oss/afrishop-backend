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

  async create(data: { name: string; nameEn?: string; parentId?: string; image?: string }) {
    const slug = slugify(data.name, { lower: true, strict: true });
    return this.prisma.category.create({ data: { ...data, slug } });
  }
}
