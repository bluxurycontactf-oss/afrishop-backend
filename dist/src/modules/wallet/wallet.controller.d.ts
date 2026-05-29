import { PrismaService } from '../../config/prisma.service';
export declare class WalletController {
    private prisma;
    constructor(prisma: PrismaService);
    getBalance(phone: string): Promise<{
        phone: string;
        balance: number;
        exists: boolean;
        transactions?: undefined;
    } | {
        phone: any;
        balance: number;
        exists: boolean;
        transactions: any[];
    }>;
    fromGiftCard(dto: {
        code: string;
        phone: string;
    }): Promise<{
        success: boolean;
        transferred: number;
        newBalance: number;
        message: string;
    }>;
    pay(dto: {
        phone: string;
        amount: number;
        orderRef: string;
    }): Promise<{
        success: boolean;
        paidAmount: number;
        remainingBalance: number;
        message: string;
    }>;
}
