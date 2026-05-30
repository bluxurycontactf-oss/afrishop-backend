import { CategoriesService } from './categories.service';
export declare class CategoriesController {
    private categories;
    constructor(categories: CategoriesService);
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
    create(dto: any): Promise<{
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
    update(id: string, dto: any): Promise<{
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
    delete(id: string): Promise<{
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
