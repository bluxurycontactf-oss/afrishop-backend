import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/* Guard that ONLY allows tokens with role=RESI_CUSTOMER. */
@Injectable()
export class ResiCustomerGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Token requis');

    try {
      const payload = this.jwt.verify(auth.slice(7));
      if (payload.role !== 'RESI_CUSTOMER') {
        throw new UnauthorizedException('Accès réservé aux clients ResiGo');
      }
      req.user = payload;
      return true;
    } catch (e) {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }
}
