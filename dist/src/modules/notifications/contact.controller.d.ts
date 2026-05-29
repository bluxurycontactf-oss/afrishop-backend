import { NotificationsService } from './notifications.service';
export declare class ContactController {
    private notifications;
    constructor(notifications: NotificationsService);
    send(dto: {
        name: string;
        contact?: string;
        message: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
