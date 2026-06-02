import { Module } from '@nestjs/common';
import { ResiContentController } from './resi-content.controller';
import { ResiRequestController } from './resi-request.controller';
import { ResiAuthController } from './resi-auth.controller';
import { ResiCustomerController } from './resi-customer.controller';
import { ResiGroupService } from './resigroup.service';
import { PrismaModule } from '../../config/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'afrishop-secret',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [ResiContentController, ResiRequestController, ResiAuthController, ResiCustomerController],
  providers: [ResiGroupService],
})
export class ResiGroupModule {}
