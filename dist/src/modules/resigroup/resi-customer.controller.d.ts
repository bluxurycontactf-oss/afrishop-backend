import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../config/prisma.service';
export declare class ResiCustomerController {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    register(body: {
        name: string;
        email: string;
        password: string;
        phone?: string;
    }): Promise<{
        success: boolean;
        message: string;
        token?: undefined;
        customer?: undefined;
    } | {
        success: boolean;
        token: string;
        customer: {
            id: string;
            name: string;
            email: string;
        };
        message?: undefined;
    }>;
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        success: boolean;
        message: string;
        token?: undefined;
        customer?: undefined;
    } | {
        success: boolean;
        token: string;
        customer: {
            id: string;
            name: string;
            email: string;
        };
        message?: undefined;
    }>;
    me(req: any): Promise<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        phone: string;
    } | {
        success: boolean;
        message: string;
    }>;
    myRequests(req: any): Promise<{
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
    update(req: any, body: {
        name?: string;
        phone?: string;
        currentPassword?: string;
        newPassword?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
