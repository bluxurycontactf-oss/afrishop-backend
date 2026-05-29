import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ContactController } from './contact.controller';
import { PrismaModule } from '../../config/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContactController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
