export declare class ResiEmailService {
    private readonly logger;
    private transporter;
    private from;
    private adminEmail;
    private phone;
    private send;
    private typeLabel;
    private screenshotInfo;
    sendClientConfirmation(req: {
        name: string;
        email: string;
        type: string;
        subject?: string;
        message?: string;
        data?: any;
    }): Promise<void>;
    sendAdminNotification(req: {
        name: string;
        email?: string;
        phone: string;
        type: string;
        subject?: string;
        message?: string;
        data?: any;
    }): Promise<void>;
    sendStatusUpdate(req: {
        name: string;
        email: string;
        type: string;
        subject?: string;
        status: string;
    }): Promise<void>;
}
