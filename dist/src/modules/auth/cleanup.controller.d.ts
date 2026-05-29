import { PrismaService } from '../../config/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class CleanupController {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    cleanupAccounts(): Promise<{
        success: boolean;
        deleted2months: number;
        deleted6months: number;
        warned30days: number;
        warned7days: number;
        processedAt: string;
    }>;
    updateActivity(): Promise<{
        success: boolean;
    }>;
}
