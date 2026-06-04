import { Module } from '@nestjs/common';
import { ResiContentController } from './resi-content.controller';
import { ResiRequestController } from './resi-request.controller';
import { ResiAuthController } from './resi-auth.controller';
import { ResiCustomerController } from './resi-customer.controller';
import { ResiGroupService } from './resigroup.service';
import { ResiEmailService } from './resi-email.service';
import { ResiAdminGuard } from './resi-admin.guard';
import { ResiCustomerGuard } from './resi-customer.guard';
import { PrismaModule } from '../../config/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'afrishop-secret',
      signOptions: { expiresIn: '30d' }, // Réduit de 30j à 8h
    }),
  ],
  controllers: [ResiContentController, ResiRequestController, ResiAuthController, ResiCustomerController],
  providers: [ResiGroupService, ResiEmailService, ResiAdminGuard, ResiCustomerGuard],
})
export class ResiGroupModule {}
