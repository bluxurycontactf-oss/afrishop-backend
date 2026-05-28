import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../config/prisma.service';
export interface CustomerRegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    country?: string;
}
export interface CustomerLoginDto {
    email: string;
    password: string;
}
export declare class CustomerAuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    register(dto: CustomerRegisterDto): Promise<{
        token: string;
        customer: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string;
            country: string;
        };
    }>;
    login(dto: CustomerLoginDto): Promise<{
        token: string;
        customer: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string;
            country: string;
            city: string;
            address: string;
        };
    }>;
    validateCustomer(id: string): Promise<{
        id: string;
        email: string;
        password: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        phone: string | null;
        country: string | null;
        city: string | null;
        address: string | null;
    }>;
    updateProfile(id: string, data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        country?: string;
        city?: string;
        address?: string;
    }): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        country: string;
        city: string;
        address: string;
    }>;
}
