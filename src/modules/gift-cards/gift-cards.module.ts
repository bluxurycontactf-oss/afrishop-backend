import { Module } from '@nestjs/common';
import { GiftCardsController } from './gift-cards.controller';
import { PrismaModule } from '../../config/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GiftCardsController],
})
export class GiftCardsModule {}
