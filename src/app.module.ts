import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CustomersModule } from './modules/customers/customers.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { WorkersModule } from './modules/workers/workers.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PrismaModule } from './config/prisma.module';

@Module({
  imports: [
    // Config globale
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Queue Redis — supporte REDIS_URL (Render) ou REDIS_HOST/PORT (local)
    BullModule.forRoot({
      redis: process.env.REDIS_URL
        ? process.env.REDIS_URL
        : { host: process.env.REDIS_HOST || '127.0.0.1', port: parseInt(process.env.REDIS_PORT) || 6379 },
    }),

    // Prisma (base de données)
    PrismaModule,

    // Modules métier
    AuthModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    CustomersModule,
    PaymentsModule,
    TrackingModule,
    ScraperModule,
    WorkersModule,
    NotificationsModule,
  ],
})
export class AppModule {}
