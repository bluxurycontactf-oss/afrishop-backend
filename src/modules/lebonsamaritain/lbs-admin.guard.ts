import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/* Guard that ONLY allows tokens with role=LBS_ADMIN. */
@Injectable()
export class LbsAdminGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Token requis');

    try {
      const payload = this.jwt.verify(auth.slice(7));
      if (payload.role !== 'LBS_ADMIN') {
        throw new UnauthorizedException('Accès réservé aux administrateurs');
      }
      req.user = payload;
      return true;
    } catch (e) {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }
}
