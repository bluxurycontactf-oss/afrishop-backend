import { PrismaService } from '../../config/prisma.service';
export declare class TrackingService {
    private prisma;
    constructor(prisma: PrismaService);
    getByOrder(orderId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        orderId: string;
        trackingNumber: string | null;
        carrier: string | null;
        events: import("@prisma/client/runtime/library").JsonValue[];
        estimatedDate: Date | null;
        deliveredAt: Date | null;
        lastCheckedAt: Date | null;
    }>;
    update(orderId: string, data: {
        trackingNumber?: string;
        carrier?: string;
        status?: string;
        events?: any[];
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        orderId: string;
        trackingNumber: string | null;
        carrier: string | null;
        events: import("@prisma/client/runtime/library").JsonValue[];
        estimatedDate: Date | null;
        deliveredAt: Date | null;
        lastCheckedAt: Date | null;
    }>;
}
