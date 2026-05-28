import { Job } from 'bull';
import { ScraperService } from '../../scraper/scraper.service';
export declare class ImportProcessor {
    private scraper;
    private readonly logger;
    constructor(scraper: ScraperService);
    handleImport(job: Job<{
        url: string;
        categoryId?: string;
        markup?: number;
    }>): Promise<{
        images: {
            id: string;
            createdAt: Date;
            sortOrder: number;
            url: string;
            alt: string | null;
            productId: string;
        }[];
        variants: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            image: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            stock: number;
            sku: string | null;
            productId: string;
            attributes: import("@prisma/client/runtime/library").JsonValue;
        }[];
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        nameEn: string | null;
        description: string | null;
        tags: string[];
        descriptionEn: string | null;
        shortDesc: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        comparePrice: import("@prisma/client/runtime/library").Decimal | null;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        currency: string;
        stock: number;
        sku: string | null;
        weight: import("@prisma/client/runtime/library").Decimal | null;
        isFeatured: boolean;
        metaTitle: string | null;
        metaDescription: string | null;
        aliexpressUrl: string | null;
        aliexpressId: string | null;
        lastSyncAt: Date | null;
        categoryId: string | null;
        supplierId: string | null;
    }>;
}
