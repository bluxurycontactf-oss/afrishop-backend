export declare class NotificationsService {
    private readonly logger;
    private transporter;
    sendOrderConfirmation(email: string, orderNumber: string, total: number): Promise<void>;
    sendShippingNotification(email: string, orderNumber: string, trackingNumber: string): Promise<void>;
    sendContactMessage(dto: {
        name: string;
        contact: string;
        message: string;
    }): Promise<void>;
}
