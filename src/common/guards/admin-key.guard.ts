import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const key = req.headers['x-admin-key'];
    const ADMIN_KEY = process.env.ADMIN_API_KEY || 'afrishop-admin-2024';
    if (key !== ADMIN_KEY) throw new UnauthorizedException('Clé admin invalide');
    return true;
  }
}
