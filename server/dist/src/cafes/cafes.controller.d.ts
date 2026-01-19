import { CafesService } from './cafes.service';
export declare class CafesController {
    private readonly cafesService;
    constructor(cafesService: CafesService);
    getStats(cafeId: string): Promise<{
        totalOrders: number;
        dailyRevenue: number | import("@prisma/client-runtime-utils").Decimal;
        activeTables: number;
        totalProducts: number;
        recentOrders: ({
            table: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                cafeId: string;
                isOccupied: boolean;
                tableNumber: number;
                lastOccupiedAt: Date | null;
            } | null;
            items: ({
                product: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                    cafeId: string;
                    categoryId: string;
                    price: import("@prisma/client-runtime-utils").Decimal;
                    stock: number;
                    imageUrl: string | null;
                    isAvailable: boolean;
                };
            } & {
                id: string;
                createdAt: Date;
                orderId: string;
                productId: string;
                quantity: number;
                unitPrice: import("@prisma/client-runtime-utils").Decimal;
                totalPrice: import("@prisma/client-runtime-utils").Decimal;
            })[];
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            cafeId: string;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            tableId: string | null;
            customerName: string | null;
        })[];
        popularProducts: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            cafeId: string;
            categoryId: string;
            price: import("@prisma/client-runtime-utils").Decimal;
            stock: number;
            imageUrl: string | null;
            isAvailable: boolean;
        }[];
    }>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        address: string | null;
        phone: string | null;
        isActive: boolean;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, body: any): Promise<{
        id: string;
        name: string;
        address: string | null;
        phone: string | null;
        isActive: boolean;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
