import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ScraperService } from '../../scraper/scraper.service';

@Processor('import')
export class ImportProcessor {
  private readonly logger = new Logger(ImportProcessor.name);

  constructor(private scraper: ScraperService) {}

  @Process('import-product')
  async handleImport(job: Job<{ url: string; categoryId?: string; markup?: number }>) {
    const { url, categoryId, markup } = job.data;
    this.logger.log(`📦 Worker: Import ${url}`);
    try {
      const product = await this.scraper.importProduct(url, categoryId, markup ?? 30);
      this.logger.log(`✅ Importé : ${product.name}`);
      return product;
    } catch (error) {
      this.logger.error(`❌ Import échoué : ${error.message}`);
      throw error;
    }
  }
}
