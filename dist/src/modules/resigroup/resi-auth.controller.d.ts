import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../config/prisma.service';
export declare class ResiAuthController {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    setup(body: {
        email: string;
        password: string;
        name?: string;
    }): Promise<{
        success: boolean;
        message: string;
        token?: undefined;
        name?: undefined;
    } | {
        success: boolean;
        token: string;
        name: string;
        message: string;
    }>;
    login(body: {
        email: string;
        password: string;
    }, req: any): Promise<{
        success: boolean;
        message: any;
        token?: undefined;
        name?: undefined;
    } | {
        success: boolean;
        token: string;
        name: string;
        message?: undefined;
    }>;
    status(): Promise<{
        hasAdmin: boolean;
    }>;
    refresh(req: any): Promise<{
        success: boolean;
        token: string;
    }>;
    update(req: any, body: {
        name?: string;
        email?: string;
        currentPassword: string;
        newPassword?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
