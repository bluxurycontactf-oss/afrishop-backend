import { Job } from 'bull';
import { ScraperService } from '../../scraper/scraper.service';
import { PrismaService } from '../../../config/prisma.service';
export declare class PriceSyncProcessor {
    private scraper;
    private prisma;
    private readonly logger;
    constructor(scraper: ScraperService, prisma: PrismaService);
    handlePriceSync(job: Job<{
        productId?: string;
    }>): Promise<void>;
}
