import { ResiGroupService } from './resigroup.service';
import { ResiEmailService } from './resi-email.service';
export declare class ResiRequestController {
    private service;
    private email;
    constructor(service: ResiGroupService, email: ResiEmailService);
    create(body: {
        type: string;
        name: string;
        phone: string;
        email?: string;
        subject?: string;
        message?: string;
        data?: any;
        resiCustomerId?: string;
    }): Promise<{
        success: boolean;
        message: string;
        id?: undefined;
    } | {
        success: boolean;
        id: string;
        message: string;
    }>;
    getAll(type?: string, status?: string): Promise<{
        id: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ResiRequestType;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        phone: string;
        subject: string | null;
        status: import(".prisma/client").$Enums.ResiRequestStatus;
        message: string | null;
        resiCustomerId: string | null;
    }[]>;
    stats(): Promise<{
        total: number;
        new: number;
        inProgress: number;
        done: number;
    }>;
    updateStatus(id: string, status: string): Promise<{
        id: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ResiRequestType;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        phone: string;
        subject: string | null;
        status: import(".prisma/client").$Enums.ResiRequestStatus;
        message: string | null;
        resiCustomerId: string | null;
    }>;
    delete(id: string): Promise<void>;
}
