import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class WorkersService {
  constructor(
    @InjectQueue('import') private importQueue: Queue,
    @InjectQueue('price-sync') private priceSyncQueue: Queue,
    @InjectQueue('stock-sync') private stockSyncQueue: Queue,
    @InjectQueue('order') private orderQueue: Queue,
    @InjectQueue('tracking') private trackingQueue: Queue,
  ) {}

  async triggerImport(url: string, categoryId?: string, markup?: number) {
    return this.importQueue.add('import-product', { url, categoryId, markup });
  }

  async triggerPriceSync(productId?: string) {
    return this.priceSyncQueue.add('sync-prices', { productId }, {
      repeat: productId ? undefined : { cron: '0 2 * * *' }, // Chaque nuit à 2h
    });
  }

  async triggerOrderProcessing(orderId: string) {
    return this.orderQueue.add('process-order', { orderId }, { delay: 5000 });
  }

  async triggerTrackingUpdate(orderId: string) {
    return this.trackingQueue.add('update-tracking', { orderId });
  }
}
