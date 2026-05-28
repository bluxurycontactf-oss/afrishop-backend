import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ScraperService } from '../../scraper/scraper.service';
import { PrismaService } from '../../../config/prisma.service';

@Processor('price-sync')
export class PriceSyncProcessor {
  private readonly logger = new Logger(PriceSyncProcessor.name);

  constructor(private scraper: ScraperService, private prisma: PrismaService) {}

  @Process('sync-prices')
  async handlePriceSync(job: Job<{ productId?: string }>) {
    if (job.data.productId) {
      await this.scraper.syncProductPrice(job.data.productId);
    } else {
      // Sync tous les produits avec URL AliExpress
      const products = await this.prisma.product.findMany({
        where: { aliexpressUrl: { not: null } },
        select: { id: true, name: true },
      });
      this.logger.log(`🔄 Sync prix pour ${products.length} produits`);
      for (const p of products) {
        await this.scraper.syncProductPrice(p.id);
        await new Promise(r => setTimeout(r, 2000)); // Pause 2s entre chaque
      }
    }
  }
}
