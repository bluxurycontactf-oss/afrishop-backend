"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LebonsamaritainModule = void 0;
const common_1 = require("@nestjs/common");
const lbs_content_controller_1 = require("./lbs-content.controller");
const lbs_auth_controller_1 = require("./lbs-auth.controller");
const lbs_service_1 = require("./lbs.service");
const lbs_admin_guard_1 = require("./lbs-admin.guard");
const prisma_module_1 = require("../../config/prisma.module");
const jwt_1 = require("@nestjs/jwt");
let LebonsamaritainModule = class LebonsamaritainModule {
};
exports.LebonsamaritainModule = LebonsamaritainModule;
exports.LebonsamaritainModule = LebonsamaritainModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'afrishop-secret',
                signOptions: { expiresIn: '30d' },
            }),
        ],
        controllers: [lbs_content_controller_1.LbsContentController, lbs_auth_controller_1.LbsAuthController],
        providers: [lbs_service_1.LbsService, lbs_admin_guard_1.LbsAdminGuard],
    })
], LebonsamaritainModule);
//# sourceMappingURL=lebonsamaritain.module.js.map