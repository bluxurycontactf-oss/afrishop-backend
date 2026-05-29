import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../config/prisma.service';
export declare class ContactController {
    private notifications;
    private prisma;
    constructor(notifications: NotificationsService, prisma: PrismaService);
    send(dto: {
        name: string;
        contact?: string;
        message: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    findAll(): Promise<unknown>;
    markRead(id: string): Promise<{
        success: boolean;
    }>;
    deleteMsg(id: string): Promise<{
        success: boolean;
    }>;
}
