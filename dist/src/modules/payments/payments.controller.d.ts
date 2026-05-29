import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private payments;
    constructor(payments: PaymentsService);
    confirm(dto: {
        orderRef: string;
        fedaTransactionId: string;
        fedaStatus: string;
        amount: number;
        currency?: string;
        customerEmail?: string;
    }): Promise<{
        success: boolean;
        orderRef: string;
        transactionId: string;
        status: any;
        amount: any;
        currency: any;
        paymentMethod: any;
    }>;
    check(transactionId: string): Promise<any>;
    webhook(payload: any, signature: string): Promise<{
        received: boolean;
    }>;
    findAll(page?: number, limit?: number): Promise<{
        payments: ({
            order: {
                orderNumber: string;
                customerName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            country: string | null;
            currency: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            orderId: string;
            method: import(".prisma/client").$Enums.PaymentMethod;
            amount: import("@prisma/client/runtime/library").Decimal;
            transactionId: string | null;
            phoneNumber: string | null;
            operator: string | null;
            gatewayData: import("@prisma/client/runtime/library").JsonValue | null;
            paidAt: Date | null;
        })[];
        total: number;
        page: number;
        pages: number;
    }>;
}
