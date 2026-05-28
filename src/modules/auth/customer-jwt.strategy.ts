import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CustomerAuthService } from './customer-auth.service';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
  constructor(private customerAuth: CustomerAuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'secret',
    });
  }

  async validate(payload: { sub: string; email: string; type: string }) {
    if (payload.type !== 'customer') throw new UnauthorizedException();
    const customer = await this.customerAuth.validateCustomer(payload.sub);
    if (!customer || !customer.isActive) throw new UnauthorizedException();
    return customer;
  }
}
