import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../config/prisma.service';

@Controller('resi/auth')
export class ResiAuthController {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // ── Setup initial account (only if none exists) ─────────────
  @Post('setup')
  @HttpCode(HttpStatus.CREATED)
  async setup(@Body() body: { email: string; password: string; name?: string }) {
    const { email, password, name } = body;
    if (!email || !password) return { success: false, message: 'Email et mot de passe requis' };
    if (password.length < 6) return { success: false, message: 'Mot de passe trop court (6 caractères minimum)' };

    try {
      const existing = await this.prisma.resiAdmin.count();
      if (existing > 0) return { success: false, message: 'Un compte admin existe déjà. Connectez-vous.' };

      const hash = await bcrypt.hash(password, 10);
      const admin = await this.prisma.resiAdmin.create({
        data: { email, passwordHash: hash, name: name || 'Admin' },
      });
      const token = this.jwt.sign({ sub: admin.id, email: admin.email, role: 'RESI_ADMIN' });
      return { success: true, token, name: admin.name, message: 'Compte créé avec succès !' };
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
      const admin = await this.prisma.resiAdmin.findUnique({ where: { email } });
      if (!admin) return { success: false, message: 'Identifiants incorrects' };

      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (!valid) return { success: false, message: 'Identifiants incorrects' };

      const token = this.jwt.sign({ sub: admin.id, email: admin.email, role: 'RESI_ADMIN' });
      return { success: true, token, name: admin.name };
    } catch (e) {
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  // ── Check if setup is needed ─────────────────────────────────
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

  // ── Update credentials (requires valid token) ────────────────
  @Post('update')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async update(
    @Request() req: any,
    @Body() body: { name?: string; email?: string; currentPassword: string; newPassword?: string },
  ) {
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
        if (newPassword.length < 6) return { success: false, message: 'Nouveau mot de passe trop court (6 min)' };
        updateData.passwordHash = await bcrypt.hash(newPassword, 10);
      }

      await this.prisma.resiAdmin.update({ where: { id: admin.id }, data: updateData });
      return { success: true, message: 'Informations mises à jour avec succès' };
    } catch (e) {
      return { success: false, message: 'Erreur lors de la mise à jour' };
    }
  }
}
