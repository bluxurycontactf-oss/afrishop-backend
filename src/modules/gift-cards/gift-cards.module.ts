import { Module } from '@nestjs/common';
import { GiftCardsController } from './gift-cards.controller';
import { PrismaModule } from '../../config/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [GiftCardsController],
})
export class GiftCardsModule {}
