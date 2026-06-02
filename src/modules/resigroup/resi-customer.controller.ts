import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ResiCustomerGuard } from './resi-customer.guard';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../config/prisma.service';

@Controller('resi/customer')
export class ResiCustomerController {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  // ── Register ────────────────────────────────────────────────
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: { name: string; email: string; password: string; phone?: string }) {
    const { name, email, password, phone } = body;
    if (!name || !email || !password) return { success: false, message: 'Tous les champs sont requis' };
    if (password.length < 6) return { success: false, message: 'Mot de passe trop court (6 caractères minimum)' };
    try {
      const exists = await this.prisma.resiCustomer.findUnique({ where: { email } });
      if (exists) return { success: false, message: 'Un compte existe déjà avec cet email' };
      const hash = await bcrypt.hash(password, 10);
      const customer = await this.prisma.resiCustomer.create({
        data: { name, email, passwordHash: hash, phone },
      });
      const token = this.jwt.sign({ sub: customer.id, email: customer.email, role: 'RESI_CUSTOMER' }, { expiresIn: '7d' });
      return { success: true, token, customer: { id: customer.id, name: customer.name, email: customer.email } };
    } catch (e) {
      return { success: false, message: 'Erreur lors de la création du compte' };
    }
  }

  // ── Login ────────────────────────────────────────────────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    if (!email || !password) return { success: false, message: 'Email et mot de passe requis' };
    try {
      const customer = await this.prisma.resiCustomer.findUnique({ where: { email } });
      if (!customer) return { success: false, message: 'Identifiants incorrects' };
      const valid = await bcrypt.compare(password, customer.passwordHash);
      if (!valid) return { success: false, message: 'Identifiants incorrects' };
      const token = this.jwt.sign({ sub: customer.id, email: customer.email, role: 'RESI_CUSTOMER' }, { expiresIn: '7d' });
      return { success: true, token, customer: { id: customer.id, name: customer.name, email: customer.email } };
    } catch (e) {
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  // ── Get profile ──────────────────────────────────────────────
  @Get('me')
  @UseGuards(ResiCustomerGuard)
  async me(@Request() req: any) {
    try {
      const customer = await this.prisma.resiCustomer.findUnique({
        where: { id: req.user.sub },
        select: { id: true, name: true, email: true, phone: true, createdAt: true },
      });
      return customer || { success: false, message: 'Client introuvable' };
    } catch (e) {
      return { success: false, message: 'Erreur' };
    }
  }

  // ── Get my requests (order history) ─────────────────────────
  @Get('requests')
  @UseGuards(ResiCustomerGuard)
  async myRequests(@Request() req: any) {
    try {
      return await this.prisma.resiRequest.findMany({
        where: { resiCustomerId: req.user.sub },
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      return [];
    }
  }

  // ── Update profile ───────────────────────────────────────────
  @Post('update')
  @UseGuards(ResiCustomerGuard)
  @HttpCode(HttpStatus.OK)
  async update(@Request() req: any, @Body() body: { name?: string; phone?: string; currentPassword?: string; newPassword?: string }) {
    try {
      const customer = await this.prisma.resiCustomer.findUnique({ where: { id: req.user.sub } });
      if (!customer) return { success: false, message: 'Client introuvable' };
      const update: any = {};
      if (body.name) update.name = body.name;
      if (body.phone) update.phone = body.phone;
      if (body.newPassword) {
        if (!body.currentPassword) return { success: false, message: 'Mot de passe actuel requis' };
        const valid = await bcrypt.compare(body.currentPassword, customer.passwordHash);
        if (!valid) return { success: false, message: 'Mot de passe actuel incorrect' };
        if (body.newPassword.length < 6) return { success: false, message: 'Nouveau mot de passe trop court' };
        update.passwordHash = await bcrypt.hash(body.newPassword, 10);
      }
      await this.prisma.resiCustomer.update({ where: { id: customer.id }, data: update });
      return { success: true, message: 'Profil mis à jour' };
    } catch (e) {
      return { success: false, message: 'Erreur lors de la mise à jour' };
    }
  }
}
