"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const bull_1 = require("@nestjs/bull");
const auth_module_1 = require("./modules/auth/auth.module");
const products_module_1 = require("./modules/products/products.module");
const categories_module_1 = require("./modules/categories/categories.module");
const orders_module_1 = require("./modules/orders/orders.module");
const customers_module_1 = require("./modules/customers/customers.module");
const payments_module_1 = require("./modules/payments/payments.module");
const tracking_module_1 = require("./modules/tracking/tracking.module");
const scraper_module_1 = require("./modules/scraper/scraper.module");
const workers_module_1 = require("./modules/workers/workers.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const gift_cards_module_1 = require("./modules/gift-cards/gift-cards.module");
const wallet_module_1 = require("./modules/wallet/wallet.module");
const reviews_module_1 = require("./modules/reviews/reviews.module");
const coupons_module_1 = require("./modules/coupons/coupons.module");
const push_module_1 = require("./modules/push/push.module");
const prisma_module_1 = require("./config/prisma.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
            bull_1.BullModule.forRoot({
                redis: process.env.REDIS_URL
                    ? process.env.REDIS_URL
                    : { host: process.env.REDIS_HOST || '127.0.0.1', port: parseInt(process.env.REDIS_PORT) || 6379 },
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            products_module_1.ProductsModule,
            categories_module_1.CategoriesModule,
            orders_module_1.OrdersModule,
            customers_module_1.CustomersModule,
            payments_module_1.PaymentsModule,
            tracking_module_1.TrackingModule,
            scraper_module_1.ScraperModule,
            workers_module_1.WorkersModule,
            notifications_module_1.NotificationsModule,
            gift_cards_module_1.GiftCardsModule,
            wallet_module_1.WalletModule,
            reviews_module_1.ReviewsModule,
            coupons_module_1.CouponsModule,
            push_module_1.PushModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map