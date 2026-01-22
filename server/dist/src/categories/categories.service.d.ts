import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(cafeId: string, createCategoryDto: CreateCategoryDto): Promise<{
        id: string;
        cafeId: string;
        name: string;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
    }>;
    findAll(cafeId: string): Promise<({
        _count: {
            products: number;
        };
    } & {
        id: string;
        cafeId: string;
        name: string;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
    })[]>;
    reorder(items: {
        id: string;
        sortOrder: number;
    }[]): Promise<{
        id: string;
        cafeId: string;
        name: string;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        cafeId: string;
        name: string;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
    }>;
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<{
        id: string;
        cafeId: string;
        name: string;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        cafeId: string;
        name: string;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
    }>;
}
