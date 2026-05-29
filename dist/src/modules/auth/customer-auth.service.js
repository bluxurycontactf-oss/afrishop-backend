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
exports.CustomerAuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../../config/prisma.service");
let CustomerAuthService = class CustomerAuthService {
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async register(dto) {
        const exists = await this.prisma.customer.findUnique({ where: { email: dto.email } });
        if (exists)
            throw new common_1.ConflictException('Email déjà utilisé');
        const hashed = await bcrypt.hash(dto.password, 10);
        const customer = await this.prisma.customer.create({
            data: {
                email: dto.email,
                password: hashed,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone,
                country: dto.country,
            },
        });
        await this.prisma.$queryRawUnsafe(`UPDATE customers SET "termsAcceptedAt"=NOW(),"lastActivityAt"=NOW() WHERE id=$1`, customer.id);
        const token = this.jwt.sign({
            sub: customer.id,
            email: customer.email,
            type: 'customer',
        });
        return {
            token,
            customer: {
                id: customer.id,
                email: customer.email,
                firstName: customer.firstName,
                lastName: customer.lastName,
                phone: customer.phone,
                country: customer.country,
            },
        };
    }
    async login(dto) {
        const customer = await this.prisma.customer.findUnique({ where: { email: dto.email } });
        if (!customer || !customer.isActive)
            throw new common_1.UnauthorizedException('Identifiants invalides');
        if (!customer.password)
            throw new common_1.UnauthorizedException('Connexion par email non configurée');
        const valid = await bcrypt.compare(dto.password, customer.password);
        if (!valid)
            throw new common_1.UnauthorizedException('Identifiants invalides');
        await this.prisma.$queryRawUnsafe(`UPDATE customers SET "lastActivityAt"=NOW() WHERE id=$1`, customer.id);
        const token = this.jwt.sign({
            sub: customer.id,
            email: customer.email,
            type: 'customer',
        });
        return {
            token,
            customer: {
                id: customer.id,
                email: customer.email,
                firstName: customer.firstName,
                lastName: customer.lastName,
                phone: customer.phone,
                country: customer.country,
                city: customer.city,
                address: customer.address,
            },
        };
    }
    async validateCustomer(id) {
        return this.prisma.customer.findUnique({ where: { id } });
    }
    async updateProfile(id, data) {
        const updated = await this.prisma.customer.update({
            where: { id },
            data,
            select: {
                id: true, email: true, firstName: true, lastName: true,
                phone: true, country: true, city: true, address: true,
            },
        });
        return updated;
    }
};
exports.CustomerAuthService = CustomerAuthService;
exports.CustomerAuthService = CustomerAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], CustomerAuthService);
//# sourceMappingURL=customer-auth.service.js.map