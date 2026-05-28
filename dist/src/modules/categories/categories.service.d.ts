import { PrismaService } from '../../config/prisma.service';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        children: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            nameEn: string | null;
            description: string | null;
            image: string | null;
            parentId: string | null;
            sortOrder: number;
        }[];
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        nameEn: string | null;
        description: string | null;
        image: string | null;
        parentId: string | null;
        sortOrder: number;
    })[]>;
    create(data: {
        name: string;
        nameEn?: string;
        parentId?: string;
        image?: string;
    }): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        nameEn: string | null;
        description: string | null;
        image: string | null;
        parentId: string | null;
        sortOrder: number;
    }>;
}
