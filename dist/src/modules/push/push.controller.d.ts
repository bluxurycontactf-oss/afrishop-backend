import { PrismaService } from '../../config/prisma.service';
export declare class PushController {
    private prisma;
    constructor(prisma: PrismaService);
    getPublicKey(): {
        publicKey: string;
    };
    subscribe(dto: {
        endpoint: string;
        keys: any;
        userAgent?: string;
    }): Promise<{
        success: boolean;
    }>;
    unsubscribe(dto: {
        endpoint: string;
    }): Promise<{
        success: boolean;
    }>;
    notifyAll(dto: {
        title: string;
        body: string;
        url?: string;
        icon?: string;
    }): Promise<{
        success: boolean;
        sent: number;
        failed: number;
        total: number;
    }>;
    count(): Promise<{
        count: any;
    }>;
}
