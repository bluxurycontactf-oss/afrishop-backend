import { TrackingService } from './tracking.service';
export declare class TrackingController {
    private tracking;
    constructor(tracking: TrackingService);
    getTracking(orderId: string): Promise<{
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
