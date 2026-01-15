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
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
    }>;
    findAll(cafeId: string): Promise<({
        _count: {
            products: number;
        };
    } & {
        id: string;
        cafeId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
    })[]>;
    findOne(id: string): Promise<{
        id: string;
        cafeId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
    }>;
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<{
        id: string;
        cafeId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        cafeId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
    }>;
}
