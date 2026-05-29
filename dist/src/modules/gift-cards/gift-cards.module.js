"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiftCardsModule = void 0;
const common_1 = require("@nestjs/common");
const gift_cards_controller_1 = require("./gift-cards.controller");
const prisma_module_1 = require("../../config/prisma.module");
let GiftCardsModule = class GiftCardsModule {
};
exports.GiftCardsModule = GiftCardsModule;
exports.GiftCardsModule = GiftCardsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [gift_cards_controller_1.GiftCardsController],
    })
], GiftCardsModule);
//# sourceMappingURL=gift-cards.module.js.map