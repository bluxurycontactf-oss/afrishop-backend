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
    getFee(amount: string): {
        amount: number;
        fee: number;
        net: number;
        feePercent: string;
    };
    withdraw(dto: {
        phone: string;
        amount: number;
        operator: string;
        momoNumber: string;
    }): Promise<{
        success: boolean;
        withdrawalId: any;
        amount: number;
        fee: number;
        netAmount: number;
        operator: string;
        momoNumber: string;
        newBalance: number;
        message: string;
    }>;
    listWithdrawals(): Promise<unknown>;
    processWithdrawal(id: string, dto: {
        note?: string;
    }): Promise<{
        success: boolean;
    }>;
    rejectWithdrawal(id: string, dto: {
        note?: string;
    }): Promise<{
        success: boolean;
        refunded: number;
    }>;
}
