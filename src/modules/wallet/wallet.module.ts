import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { PrismaModule } from '../../config/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WalletController],
})
export class WalletModule {}
