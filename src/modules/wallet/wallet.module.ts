import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { PrismaModule } from '../../config/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [WalletController],
})
export class WalletModule {}
