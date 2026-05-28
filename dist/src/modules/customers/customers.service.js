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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let CustomersService = class CustomersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const { page = 1, limit = 20, search } = query;
        const where = search ? { OR: [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ] } : {};
        const [customers, total] = await Promise.all([
            this.prisma.customer.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
            this.prisma.customer.count({ where }),
        ]);
        return { customers, total, page, limit };
    }
    async findOne(id) {
        return this.prisma.customer.findUnique({ where: { id }, include: { orders: { take: 10, orderBy: { createdAt: 'desc' } } } });
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map