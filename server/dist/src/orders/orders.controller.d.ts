import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    findMyOrders(req: any): import("@prisma/client").Prisma.PrismaPromise<({
        reviews: {
            id: string;
            createdAt: Date;
            customerName: string | null;
            rating: number;
            comment: string | null;
            adminScore: number | null;
            adminReply: string | null;
            isVisible: boolean;
            productId: string;
            orderId: string | null;
            customerId: string | null;
        }[];
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
                id: string;
                cafeId: string;
                categoryId: string;
                name: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                originalPrice: import("@prisma/client/runtime/library").Decimal | null;
                stock: number;
                sortOrder: number;
                imageUrl: string | null;
                isAvailable: boolean;
                requiresPreparation: boolean;
                isChefRecommended: boolean;
                averageRating: import("@prisma/client/runtime/library").Decimal;
                reviewCount: number;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            productId: string;
            orderId: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
        })[];
    } & {
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        customerName: string | null;
        customerId: string | null;
        status: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        tableId: string | null;
    })[]>;
    create(cafeId: string, createOrderDto: CreateOrderDto): Promise<{
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
                id: string;
                cafeId: string;
                categoryId: string;
                name: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                originalPrice: import("@prisma/client/runtime/library").Decimal | null;
                stock: number;
                sortOrder: number;
                imageUrl: string | null;
                isAvailable: boolean;
                requiresPreparation: boolean;
                isChefRecommended: boolean;
                averageRating: import("@prisma/client/runtime/library").Decimal;
                reviewCount: number;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            productId: string;
            orderId: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
        })[];
    } & {
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        customerName: string | null;
        customerId: string | null;
        status: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        tableId: string | null;
    }>;
    findAll(cafeId: string): import("@prisma/client").Prisma.PrismaPromise<({
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
                id: string;
                cafeId: string;
                categoryId: string;
                name: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                originalPrice: import("@prisma/client/runtime/library").Decimal | null;
                stock: number;
                sortOrder: number;
                imageUrl: string | null;
                isAvailable: boolean;
                requiresPreparation: boolean;
                isChefRecommended: boolean;
                averageRating: import("@prisma/client/runtime/library").Decimal;
                reviewCount: number;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            productId: string;
            orderId: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
        })[];
    } & {
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        customerName: string | null;
        customerId: string | null;
        status: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        tableId: string | null;
    })[]>;
    updateStatus(id: string, status: string): Promise<{
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
                id: string;
                cafeId: string;
                categoryId: string;
                name: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                originalPrice: import("@prisma/client/runtime/library").Decimal | null;
                stock: number;
                sortOrder: number;
                imageUrl: string | null;
                isAvailable: boolean;
                requiresPreparation: boolean;
                isChefRecommended: boolean;
                averageRating: import("@prisma/client/runtime/library").Decimal;
                reviewCount: number;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            productId: string;
            orderId: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            note: string | null;
        })[];
    } & {
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        customerName: string | null;
        customerId: string | null;
        status: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        tableId: string | null;
    }>;
    closeTable(tableId: string): Promise<{
        message: string;
        totalAmount: number;
    }>;
}
