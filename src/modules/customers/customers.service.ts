import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}
  async findAll(query: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 20, search } = query;
    const where: any = search ? { OR: [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ]} : {};
    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.customer.count({ where }),
    ]);
    return { customers, total, page, limit };
  }
  async findOne(id: string) {
    return this.prisma.customer.findUnique({ where: { id }, include: { orders: { take: 10, orderBy: { createdAt: 'desc' } } } });
  }
}
