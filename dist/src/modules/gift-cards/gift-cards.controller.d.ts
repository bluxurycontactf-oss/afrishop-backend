import { PrismaService } from '../../config/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class GiftCardsController {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    purchase(dto: {
        amount: number;
        email: string;
        transactionId: string;
        message?: string;
    }): Promise<{
        success: boolean;
        code: string;
        amount: number;
        email: string;
    }>;
    check(code: string): Promise<{
        code: any;
        amount: number;
        balance: number;
        isActive: any;
        firstUsedAt: any;
        expiresAt: any;
        daysLeft: number;
        message: string;
    }>;
    redeem(dto: {
        code: string;
        amount: number;
        orderRef: string;
        ownerPhone?: string;
        ownerEmail?: string;
    }): Promise<{
        success: boolean;
        usedAmount: number;
        remainingBalance: number;
        expiresAt: any;
        message: string;
    }>;
    processExpired(): Promise<{
        success: boolean;
        processed: number;
        message: string;
    }>;
    generate(dto: {
        amount: number;
        quantity?: number;
        note?: string;
        recipientEmail?: string;
    }): Promise<{
        success: boolean;
        cards: any[];
        emailSent: boolean;
    }>;
    findAll(): Promise<any[]>;
    deactivate(id: string): Promise<{
        success: boolean;
    }>;
}
