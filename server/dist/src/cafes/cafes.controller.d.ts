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
                cafeId: string;
                createdAt: Date;
                updatedAt: Date;
                isOccupied: boolean;
                tableNumber: number;
                lastOccupiedAt: Date | null;
            } | null;
            items: ({
                product: {
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
                };
            } & {
                id: string;
                createdAt: Date;
                quantity: number;
                unitPrice: import("@prisma/client-runtime-utils").Decimal;
                totalPrice: import("@prisma/client-runtime-utils").Decimal;
                productId: string;
                orderId: string;
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
        }[];
    }>;
    findOne(id: string): Promise<{
        phone: string | null;
        email: string | null;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: string | null;
        city: string | null;
        district: string | null;
        address: string | null;
        website: string | null;
        authorizedPerson: string | null;
        serviceType: string | null;
        workingHours: string | null;
        preparationTime: number | null;
        paymentMethods: string | null;
        logoUrl: string | null;
        googleMapsUrl: string | null;
        status: string;
    }>;
    uploadLogo(id: string, file: Express.Multer.File): Promise<{
        phone: string | null;
        email: string | null;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: string | null;
        city: string | null;
        district: string | null;
        address: string | null;
        website: string | null;
        authorizedPerson: string | null;
        serviceType: string | null;
        workingHours: string | null;
        preparationTime: number | null;
        paymentMethods: string | null;
        logoUrl: string | null;
        googleMapsUrl: string | null;
        status: string;
    }>;
    update(id: string, body: any): Promise<{
        phone: string | null;
        email: string | null;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: string | null;
        city: string | null;
        district: string | null;
        address: string | null;
        website: string | null;
        authorizedPerson: string | null;
        serviceType: string | null;
        workingHours: string | null;
        preparationTime: number | null;
        paymentMethods: string | null;
        logoUrl: string | null;
        googleMapsUrl: string | null;
        status: string;
    }>;
}
