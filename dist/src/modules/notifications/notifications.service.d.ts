export declare class NotificationsService {
    private readonly logger;
    private transporter;
    private from;
    private send;
    sendOrderConfirmation(email: string, orderNumber: string, total: number): Promise<void>;
    sendOrderStatusUpdate(email: string, orderNumber: string, status: string, trackingNumber?: string): Promise<void>;
    sendGiftCard(email: string, code: string, amount: number, note?: string): Promise<void>;
    sendWithdrawalConfirmation(email: string, dto: {
        amount: number;
        fee: number;
        net: number;
        operator: string;
        momoNumber: string;
    }): Promise<void>;
    sendContactMessage(dto: {
        name: string;
        contact: string;
        message: string;
    }): Promise<void>;
}
