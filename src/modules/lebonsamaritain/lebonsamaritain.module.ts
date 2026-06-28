import { Module } from '@nestjs/common';
import { LbsContentController } from './lbs-content.controller';
import { LbsAuthController } from './lbs-auth.controller';
import { LbsService } from './lbs.service';
import { LbsAdminGuard } from './lbs-admin.guard';
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
  controllers: [LbsContentController, LbsAuthController],
  providers: [LbsService, LbsAdminGuard],
})
export class LebonsamaritainModule {}
