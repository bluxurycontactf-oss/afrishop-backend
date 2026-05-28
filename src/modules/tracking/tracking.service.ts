import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService) {}
  async getByOrder(orderId: string) {
    return this.prisma.tracking.findUnique({ where: { orderId } });
  }
  async update(orderId: string, data: { trackingNumber?: string; carrier?: string; status?: string; events?: any[] }) {
    return this.prisma.tracking.update({ where: { orderId }, data: { ...data, lastCheckedAt: new Date() } });
  }
}
