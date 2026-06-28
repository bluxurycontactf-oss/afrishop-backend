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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LbsAdminGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
let LbsAdminGuard = class LbsAdminGuard {
    constructor(jwt) {
        this.jwt = jwt;
    }
    canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        const auth = req.headers['authorization'];
        if (!auth?.startsWith('Bearer '))
            throw new common_1.UnauthorizedException('Token requis');
        try {
            const payload = this.jwt.verify(auth.slice(7));
            if (payload.role !== 'LBS_ADMIN') {
                throw new common_1.UnauthorizedException('Accès réservé aux administrateurs');
            }
            req.user = payload;
            return true;
        }
        catch (e) {
            throw new common_1.UnauthorizedException('Token invalide ou expiré');
        }
    }
};
exports.LbsAdminGuard = LbsAdminGuard;
exports.LbsAdminGuard = LbsAdminGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], LbsAdminGuard);
//# sourceMappingURL=lbs-admin.guard.js.map