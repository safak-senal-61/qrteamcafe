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
