import { PrismaService } from '../../config/prisma.service';
export declare class ReviewsController {
    private prisma;
    constructor(prisma: PrismaService);
    submit(dto: {
        productId: string;
        rating: number;
        comment?: string;
        title?: string;
        authorName: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getByProduct(productId: string): Promise<{
        reviews: any[];
        avgRating: number;
        total: any;
    }>;
    findAll(approved?: string): Promise<unknown>;
    approve(id: string): Promise<{
        success: boolean;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
