"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResiGroupModule = void 0;
const common_1 = require("@nestjs/common");
const resi_content_controller_1 = require("./resi-content.controller");
const resi_request_controller_1 = require("./resi-request.controller");
const resi_auth_controller_1 = require("./resi-auth.controller");
const resi_customer_controller_1 = require("./resi-customer.controller");
const resi_ai_controller_1 = require("./resi-ai.controller");
const resigroup_service_1 = require("./resigroup.service");
const resi_email_service_1 = require("./resi-email.service");
const resi_admin_guard_1 = require("./resi-admin.guard");
const resi_customer_guard_1 = require("./resi-customer.guard");
const prisma_module_1 = require("../../config/prisma.module");
const jwt_1 = require("@nestjs/jwt");
let ResiGroupModule = class ResiGroupModule {
};
exports.ResiGroupModule = ResiGroupModule;
exports.ResiGroupModule = ResiGroupModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'afrishop-secret',
                signOptions: { expiresIn: '30d' },
            }),
        ],
        controllers: [resi_content_controller_1.ResiContentController, resi_request_controller_1.ResiRequestController, resi_auth_controller_1.ResiAuthController, resi_customer_controller_1.ResiCustomerController, resi_ai_controller_1.ResiAiController],
        providers: [resigroup_service_1.ResiGroupService, resi_email_service_1.ResiEmailService, resi_admin_guard_1.ResiAdminGuard, resi_customer_guard_1.ResiCustomerGuard],
    })
], ResiGroupModule);
//# sourceMappingURL=resigroup.module.js.map