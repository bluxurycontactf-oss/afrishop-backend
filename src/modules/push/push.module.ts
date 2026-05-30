import { Module } from '@nestjs/common';
import { PushController } from './push.controller';
import { PrismaModule } from '../../config/prisma.module';

@Module({ imports: [PrismaModule], controllers: [PushController] })
export class PushModule {}
