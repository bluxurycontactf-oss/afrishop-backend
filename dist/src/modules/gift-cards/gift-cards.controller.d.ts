import { PrismaService } from '../../config/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class GiftCardsController {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
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
