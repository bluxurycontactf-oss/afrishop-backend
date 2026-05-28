import { Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private auth;
    constructor(auth: AuthService);
    validate(payload: {
        sub: string;
        email: string;
        role: string;
    }): Promise<{
        id: string;
        email: string;
        password: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export {};
