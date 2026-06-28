import { ResiGroupService } from './resigroup.service';
export declare class ResiContentController {
    private service;
    constructor(service: ResiGroupService);
    getAll(): Promise<Record<string, any>>;
    getOne(key: string): Promise<any>;
    saveAll(body: Record<string, any>): Promise<{
        success: boolean;
        message: string;
    }>;
    saveOne(key: string, body: {
        data: any;
    }): Promise<{
        success: boolean;
        row: any;
    }>;
    checkAvailability(body: {
        propertyId: string;
        checkIn: string;
        checkOut: string;
    }): Promise<{
        available: boolean;
        message: string;
        nextAvailableFrom?: string;
        availableUntil?: string;
        conflicts?: Array<{
            checkIn: string;
            checkOut: string;
        }>;
    }>;
}
