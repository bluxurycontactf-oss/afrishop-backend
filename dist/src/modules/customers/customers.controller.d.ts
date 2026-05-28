import { CustomersService } from './customers.service';
export declare class CustomersController {
    private customers;
    constructor(customers: CustomersService);
    findAll(query: any): Promise<{
        customers: {
            id: string;
            email: string;
            password: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            phone: string | null;
            country: string | null;
            city: string | null;
            address: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<{
        orders: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            total: import("@prisma/client/runtime/library").Decimal;
            customerId: string | null;
            orderNumber: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            customerName: string;
            customerEmail: string;
            customerPhone: string;
            shippingAddress: string;
            shippingCity: string;
            shippingCountry: string;
            shippingMethod: string | null;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            shippingCost: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            aliexpressOrderId: string | null;
            supplierOrderStatus: string | null;
            notes: string | null;
            couponId: string | null;
        }[];
    } & {
        id: string;
        email: string;
        password: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        phone: string | null;
        country: string | null;
        city: string | null;
        address: string | null;
    }>;
}
