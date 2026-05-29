import { Controller, Post, Body, HttpCode, Get, Put, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerJwtGuard } from './customer-jwt.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private customerAuth: CustomerAuthService,
  ) {}

  /* ── ADMIN ── */
  @Post('register')
  @ApiOperation({ summary: 'Créer un compte admin' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Connexion admin' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('admin-token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Obtenir un token admin sécurisé' })
  adminToken(@Body() body: { password: string }) {
    return this.auth.getAdminToken(body.password);
  }

  /* ── CLIENT ── */
  @Post('customer/register')
  @ApiOperation({ summary: 'Créer un compte client' })
  customerRegister(@Body() dto: any) {
    return this.customerAuth.register(dto);
  }

  @Post('customer/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Connexion client' })
  customerLogin(@Body() dto: any) {
    return this.customerAuth.login(dto);
  }

  @Get('customer/me')
  @ApiBearerAuth()
  @UseGuards(CustomerJwtGuard)
  @ApiOperation({ summary: 'Profil du client connecté' })
  getMe(@Request() req: any) {
    const { password, ...customer } = req.user;
    return customer;
  }

  @Put('customer/me')
  @ApiBearerAuth()
  @UseGuards(CustomerJwtGuard)
  @ApiOperation({ summary: 'Mettre à jour le profil client' })
  async updateMe(@Request() req: any, @Body() body: any) {
    const { prisma } = req.user as any;
    // On passe l'ID du customer connecté
    return this.customerAuth.updateProfile(req.user.id, body);
  }
}
