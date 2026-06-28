import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
export declare class LbsService implements OnModuleInit {
    private prisma;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    getAllContent(): Promise<Record<string, any>>;
    getContent(key: string): Promise<any>;
    upsertContent(key: string, data: any): Promise<any>;
    upsertAllContent(payload: Record<string, any>): Promise<void>;
}
