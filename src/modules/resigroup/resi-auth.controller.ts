import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../config/prisma.service';
import { ResiAdminGuard } from './resi-admin.guard';

/* Brute-force protection — in-memory per IP */
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 min

function checkBruteForce(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (entry) {
    if (now < entry.resetAt && entry.count >= MAX_ATTEMPTS) {
      const wait = Math.ceil((entry.resetAt - now) / 60000);
      throw { status: 429, message: `Trop de tentatives. Réessayez dans ${wait} minute(s).` };
    }
    if (now >= entry.resetAt) loginAttempts.delete(ip);
  }
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, resetAt: now + BLOCK_DURATION };
  entry.count += 1;
  if (entry.count === 1) entry.resetAt = now + BLOCK_DURATION;
  loginAttempts.set(ip, entry);
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

@Controller('resi/auth')
export class ResiAuthController {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  // ── Setup initial account (only if none exists) ─────────────
  @Post('setup')
  @HttpCode(HttpStatus.CREATED)
  async setup(@Body() body: { email: string; password: string; name?: string }) {
    const { email, password, name } = body;
    if (!email || !password) return { success: false, message: 'Email et mot de passe requis' };
    if (password.length < 8) return { success: false, message: 'Mot de passe trop court (8 caractères minimum)' };

    try {
      const existing = await this.prisma.resiAdmin.count();
      if (existing > 0) return { success: false, message: 'Un compte admin existe déjà. Connectez-vous.' };

      const hash = await bcrypt.hash(password, 12);
      const admin = await this.prisma.resiAdmin.create({
        data: { email, passwordHash: hash, name: name || 'Admin' },
      });
      const token = this.jwt.sign(
        { sub: admin.id, email: admin.email, role: 'RESI_ADMIN' },
        { expiresIn: '8h' },
      );
      return { success: true, token, name: admin.name, message: 'Compte créé avec succès !' };
    } catch (e) {
      return { success: false, message: 'Erreur lors de la création du compte' };
    }
  }

  // ── Login with brute-force protection ────────────────────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }, @Request() req: any) {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const { email, password } = body;
    if (!email || !password) return { success: false, message: 'Email et mot de passe requis' };

    try { checkBruteForce(ip); }
    catch (e: any) { return { success: false, message: e.message }; }

    try {
      const admin = await this.prisma.resiAdmin.findUnique({ where: { email } });
      if (!admin) { recordFailure(ip); return { success: false, message: 'Identifiants incorrects' }; }

      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (!valid) { recordFailure(ip); return { success: false, message: 'Identifiants incorrects' }; }

      clearAttempts(ip);
      const token = this.jwt.sign(
        { sub: admin.id, email: admin.email, role: 'RESI_ADMIN' },
        { expiresIn: '8h' },
      );
      return { success: true, token, name: admin.name };
    } catch (e) {
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  // ── Status ───────────────────────────────────────────────────
  @Get('status')
  @HttpCode(HttpStatus.OK)
  async status() {
    try {
      const count = await this.prisma.resiAdmin.count();
      return { hasAdmin: count > 0 };
    } catch (e) {
      return { hasAdmin: false };
    }
  }

  // ── Refresh token (extend session 8h) ────────────────────────
  @Post('refresh')
  @UseGuards(ResiAdminGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req: any) {
    const token = this.jwt.sign(
      { sub: req.user.sub, email: req.user.email, role: 'RESI_ADMIN' },
      { expiresIn: '8h' },
    );
    return { success: true, token };
  }

  // ── Update credentials ───────────────────────────────────────
  @Post('update')
  @UseGuards(ResiAdminGuard)
  @HttpCode(HttpStatus.OK)
  async update(@Request() req: any, @Body() body: { name?: string; email?: string; currentPassword: string; newPassword?: string }) {
    const { name, email, currentPassword, newPassword } = body;
    if (!currentPassword) return { success: false, message: 'Mot de passe actuel requis' };

    try {
      const admin = await this.prisma.resiAdmin.findUnique({ where: { id: req.user.sub } });
      if (!admin) return { success: false, message: 'Admin introuvable' };

      const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!valid) return { success: false, message: 'Mot de passe actuel incorrect' };

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (newPassword) {
        if (newPassword.length < 8) return { success: false, message: 'Nouveau mot de passe trop court (8 min)' };
        updateData.passwordHash = await bcrypt.hash(newPassword, 12);
      }

      await this.prisma.resiAdmin.update({ where: { id: admin.id }, data: updateData });
      return { success: true, message: 'Informations mises à jour avec succès' };
    } catch (e) {
      return { success: false, message: 'Erreur lors de la mise à jour' };
    }
  }
}
