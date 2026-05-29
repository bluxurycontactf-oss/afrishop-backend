import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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

@Injectable()
export class CustomerAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: CustomerRegisterDto) {
    const exists = await this.prisma.customer.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email déjà utilisé');

    const hashed = await bcrypt.hash(dto.password, 10);
    const customer = await this.prisma.customer.create({
      data: {
        email: dto.email,
        password: hashed,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        country: dto.country,
      },
    });
    // Enregistrer l'acceptation des CGU et l'activité
    await this.prisma.$queryRawUnsafe(
      `UPDATE customers SET "termsAcceptedAt"=NOW(),"lastActivityAt"=NOW() WHERE id=$1`,
      customer.id,
    );

    const token = this.jwt.sign({
      sub: customer.id,
      email: customer.email,
      type: 'customer',
    });

    return {
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        country: customer.country,
      },
    };
  }

  async login(dto: CustomerLoginDto) {
    const customer = await this.prisma.customer.findUnique({ where: { email: dto.email } });
    if (!customer || !customer.isActive) throw new UnauthorizedException('Identifiants invalides');
    if (!customer.password) throw new UnauthorizedException('Connexion par email non configurée');

    const valid = await bcrypt.compare(dto.password, customer.password);
    if (!valid) throw new UnauthorizedException('Identifiants invalides');

    // Mettre à jour lastActivityAt à chaque connexion
    await this.prisma.$queryRawUnsafe(
      `UPDATE customers SET "lastActivityAt"=NOW() WHERE id=$1`, customer.id,
    );

    const token = this.jwt.sign({
      sub: customer.id,
      email: customer.email,
      type: 'customer',
    });

    return {
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        country: customer.country,
        city: customer.city,
        address: customer.address,
      },
    };
  }

  async validateCustomer(id: string) {
    return this.prisma.customer.findUnique({ where: { id } });
  }

  async updateProfile(id: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    country?: string;
    city?: string;
    address?: string;
  }) {
    const updated = await this.prisma.customer.update({
      where: { id },
      data,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, country: true, city: true, address: true,
      },
    });
    return updated;
  }
}
