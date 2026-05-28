import { Strategy } from 'passport-jwt';
import { CustomerAuthService } from './customer-auth.service';
declare const CustomerJwtStrategy_base: new (...args: any[]) => Strategy;
export declare class CustomerJwtStrategy extends CustomerJwtStrategy_base {
    private customerAuth;
    constructor(customerAuth: CustomerAuthService);
    validate(payload: {
        sub: string;
        email: string;
        type: string;
    }): Promise<{
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
}
export {};
