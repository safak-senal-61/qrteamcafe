import { PrismaService } from '../prisma/prisma.service';
export declare class CafesService {
    private prisma;
    constructor(prisma: PrismaService);
    findOne(id: string): Promise<{
        phone: string | null;
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        status: string;
    }>;
    update(id: string, data: any): Promise<{
        phone: string | null;
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        status: string;
    }>;
    getDashboardStats(cafeId: string): Promise<{
        totalOrders: number;
        dailyRevenue: number | import("@prisma/client-runtime-utils").Decimal;
        activeTables: number;
        totalProducts: number;
        recentOrders: ({
            table: {
                id: string;
                cafeId: string;
                createdAt: Date;
                updatedAt: Date;
                isOccupied: boolean;
                tableNumber: number;
            } | null;
            items: ({
                product: {
                    id: string;
                    cafeId: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
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
            cafeId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            tableId: string | null;
            customerName: string | null;
        })[];
        popularProducts: {
            id: string;
            cafeId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            categoryId: string;
            price: import("@prisma/client-runtime-utils").Decimal;
            stock: number;
            imageUrl: string | null;
            isAvailable: boolean;
        }[];
    }>;
}
