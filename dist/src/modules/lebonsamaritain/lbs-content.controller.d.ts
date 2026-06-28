import { LbsService } from './lbs.service';
export declare class LbsContentController {
    private service;
    constructor(service: LbsService);
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
}
