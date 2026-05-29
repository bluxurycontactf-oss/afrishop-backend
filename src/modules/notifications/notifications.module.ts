import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ContactController } from './contact.controller';

@Module({
  controllers: [ContactController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
