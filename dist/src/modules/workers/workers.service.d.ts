import { Queue } from 'bull';
export declare class WorkersService {
    private importQueue;
    private priceSyncQueue;
    private stockSyncQueue;
    private orderQueue;
    private trackingQueue;
    constructor(importQueue: Queue, priceSyncQueue: Queue, stockSyncQueue: Queue, orderQueue: Queue, trackingQueue: Queue);
    triggerImport(url: string, categoryId?: string, markup?: number): Promise<import("bull").Job<any>>;
    triggerPriceSync(productId?: string): Promise<import("bull").Job<any>>;
    triggerOrderProcessing(orderId: string): Promise<import("bull").Job<any>>;
    triggerTrackingUpdate(orderId: string): Promise<import("bull").Job<any>>;
}
