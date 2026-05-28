"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkersModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const workers_service_1 = require("./workers.service");
const import_processor_1 = require("./processors/import.processor");
const price_sync_processor_1 = require("./processors/price-sync.processor");
const scraper_module_1 = require("../scraper/scraper.module");
let WorkersModule = class WorkersModule {
};
exports.WorkersModule = WorkersModule;
exports.WorkersModule = WorkersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bull_1.BullModule.registerQueue({ name: 'import' }, { name: 'price-sync' }, { name: 'stock-sync' }, { name: 'order' }, { name: 'tracking' }, { name: 'notification' }),
            scraper_module_1.ScraperModule,
        ],
        providers: [workers_service_1.WorkersService, import_processor_1.ImportProcessor, price_sync_processor_1.PriceSyncProcessor],
        exports: [workers_service_1.WorkersService],
    })
], WorkersModule);
//# sourceMappingURL=workers.module.js.map