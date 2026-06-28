import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
export declare class ResiCustomerGuard implements CanActivate {
    private jwt;
    constructor(jwt: JwtService);
    canActivate(ctx: ExecutionContext): boolean;
}
