import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AdminKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const secret = process.env.JWT_SECRET || 'secret';

    // Option 1 : JWT Bearer token (méthode sécurisée)
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload: any = jwt.verify(token, secret);
        if (payload.role === 'admin' || payload.type === 'admin') return true;
      } catch { /* token invalide ou expiré */ }
    }

    // Option 2 : Clé secrète env variable (jamais codée en dur)
    const key = req.headers['x-admin-key'];
    const ADMIN_KEY = process.env.ADMIN_API_KEY;
    if (ADMIN_KEY && key === ADMIN_KEY) return true;

    throw new UnauthorizedException('Accès non autorisé');
  }
}
