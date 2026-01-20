import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(cafeId: string, createProductDto: CreateProductDto): Promise<{
        name: string;
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        categoryId: string;
        price: import("@prisma/client-runtime-utils").Decimal;
        stock: number;
        imageUrl: string | null;
        isAvailable: boolean;
    }>;
    findAll(cafeId: string): Promise<({
        category: {
            name: string;
            id: string;
            cafeId: string;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number;
        };
    } & {
        name: string;
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        categoryId: string;
        price: import("@prisma/client-runtime-utils").Decimal;
        stock: number;
        imageUrl: string | null;
        isAvailable: boolean;
    })[]>;
    findOne(id: string): Promise<{
        category: {
            name: string;
            id: string;
            cafeId: string;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number;
        };
    } & {
        name: string;
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        categoryId: string;
        price: import("@prisma/client-runtime-utils").Decimal;
        stock: number;
        imageUrl: string | null;
        isAvailable: boolean;
    }>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<{
        name: string;
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        categoryId: string;
        price: import("@prisma/client-runtime-utils").Decimal;
        stock: number;
        imageUrl: string | null;
        isAvailable: boolean;
    }>;
    updateStock(id: string, quantity: number): Promise<{
        name: string;
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        categoryId: string;
        price: import("@prisma/client-runtime-utils").Decimal;
        stock: number;
        imageUrl: string | null;
        isAvailable: boolean;
    }>;
    remove(id: string): Promise<{
        name: string;
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        categoryId: string;
        price: import("@prisma/client-runtime-utils").Decimal;
        stock: number;
        imageUrl: string | null;
        isAvailable: boolean;
    }>;
}
