import { PrismaService } from '../../config/prisma.service';
export declare class CouponsController {
    private prisma;
    constructor(prisma: PrismaService);
    apply(dto: {
        code: string;
        orderTotal: number;
    }): Promise<{
        success: boolean;
        code: any;
        type: any;
        value: number;
        discount: number;
        newTotal: number;
        message: string;
    }>;
    create(dto: {
        code: string;
        type: 'PERCENTAGE' | 'FIXED';
        value: number;
        minOrder?: number;
        usageLimit?: number;
        expiresAt?: string;
        description?: string;
    }): Promise<{
        success: boolean;
        code: string;
    }>;
    findAll(): Promise<any[]>;
    deactivate(id: string): Promise<{
        success: boolean;
    }>;
    use(code: string): Promise<{
        success: boolean;
    }>;
}
