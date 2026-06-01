import { Module } from '@nestjs/common';
import { ResiContentController } from './resi-content.controller';
import { ResiRequestController } from './resi-request.controller';
import { ResiGroupService } from './resigroup.service';
import { PrismaModule } from '../../config/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ResiContentController, ResiRequestController],
  providers: [ResiGroupService],
})
export class ResiGroupModule {}
