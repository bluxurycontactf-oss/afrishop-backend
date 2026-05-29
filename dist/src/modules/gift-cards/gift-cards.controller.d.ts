import { PrismaService } from '../../config/prisma.service';
export declare class GiftCardsController {
    private prisma;
    constructor(prisma: PrismaService);
    check(code: string): Promise<{
        code: any;
        amount: number;
        balance: number;
        isActive: any;
    }>;
    redeem(dto: {
        code: string;
        amount: number;
        orderRef: string;
    }): Promise<{
        success: boolean;
        usedAmount: number;
        remainingBalance: number;
        message: string;
    }>;
    generate(dto: {
        amount: number;
        quantity?: number;
        note?: string;
    }): Promise<{
        success: boolean;
        cards: any[];
    }>;
    findAll(): Promise<any[]>;
    deactivate(id: string): Promise<{
        success: boolean;
    }>;
}
