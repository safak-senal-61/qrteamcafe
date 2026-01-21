import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    create(createCategoryDto: CreateCategoryDto, cafeId: string): Promise<{
        id: string;
        cafeId: string;
        name: string;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
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
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        cafeId: string;
        name: string;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<{
        id: string;
        cafeId: string;
        name: string;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        cafeId: string;
        name: string;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
