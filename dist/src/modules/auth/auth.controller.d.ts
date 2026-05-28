import { AuthService } from './auth.service';
import { CustomerAuthService } from './customer-auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private auth;
    private customerAuth;
    constructor(auth: AuthService, customerAuth: CustomerAuthService);
    register(dto: RegisterDto): Promise<{
        token: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    login(dto: LoginDto): Promise<{
        token: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    customerRegister(dto: any): Promise<{
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
    customerLogin(dto: any): Promise<{
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
    getMe(req: any): any;
    updateMe(req: any, body: any): Promise<{
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
