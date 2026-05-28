import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WorkersService } from './workers.service';
import { ImportProcessor } from './processors/import.processor';
import { PriceSyncProcessor } from './processors/price-sync.processor';
import { ScraperModule } from '../scraper/scraper.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'import' },
      { name: 'price-sync' },
      { name: 'stock-sync' },
      { name: 'order' },
      { name: 'tracking' },
      { name: 'notification' },
    ),
    ScraperModule,
  ],
  providers: [WorkersService, ImportProcessor, PriceSyncProcessor],
  exports: [WorkersService],
})
export class WorkersModule {}
