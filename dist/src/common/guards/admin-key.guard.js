"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminKeyGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt = require("jsonwebtoken");
let AdminKeyGuard = class AdminKeyGuard {
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const secret = process.env.JWT_SECRET || 'secret';
        const authHeader = req.headers['authorization'] || '';
        if (authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            try {
                const payload = jwt.verify(token, secret);
                if (payload.role === 'admin' || payload.type === 'admin')
                    return true;
            }
            catch { }
        }
        const key = req.headers['x-admin-key'];
        const ADMIN_KEY = process.env.ADMIN_API_KEY;
        if (ADMIN_KEY && key === ADMIN_KEY)
            return true;
        throw new common_1.UnauthorizedException('Accès non autorisé');
    }
};
exports.AdminKeyGuard = AdminKeyGuard;
exports.AdminKeyGuard = AdminKeyGuard = __decorate([
    (0, common_1.Injectable)()
], AdminKeyGuard);
//# sourceMappingURL=admin-key.guard.js.map