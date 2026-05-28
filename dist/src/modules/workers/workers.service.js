"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkersService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
let WorkersService = class WorkersService {
    constructor(importQueue, priceSyncQueue, stockSyncQueue, orderQueue, trackingQueue) {
        this.importQueue = importQueue;
        this.priceSyncQueue = priceSyncQueue;
        this.stockSyncQueue = stockSyncQueue;
        this.orderQueue = orderQueue;
        this.trackingQueue = trackingQueue;
    }
    async triggerImport(url, categoryId, markup) {
        return this.importQueue.add('import-product', { url, categoryId, markup });
    }
    async triggerPriceSync(productId) {
        return this.priceSyncQueue.add('sync-prices', { productId }, {
            repeat: productId ? undefined : { cron: '0 2 * * *' },
        });
    }
    async triggerOrderProcessing(orderId) {
        return this.orderQueue.add('process-order', { orderId }, { delay: 5000 });
    }
    async triggerTrackingUpdate(orderId) {
        return this.trackingQueue.add('update-tracking', { orderId });
    }
};
exports.WorkersService = WorkersService;
exports.WorkersService = WorkersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('import')),
    __param(1, (0, bull_1.InjectQueue)('price-sync')),
    __param(2, (0, bull_1.InjectQueue)('stock-sync')),
    __param(3, (0, bull_1.InjectQueue)('order')),
    __param(4, (0, bull_1.InjectQueue)('tracking')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object])
], WorkersService);
//# sourceMappingURL=workers.service.js.map