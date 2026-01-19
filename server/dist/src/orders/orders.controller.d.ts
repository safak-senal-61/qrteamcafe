import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(cafeId: string, createOrderDto: CreateOrderDto): Promise<{
        table: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            cafeId: string;
            tableNumber: number;
            isOccupied: boolean;
            lastOccupiedAt: Date | null;
        } | null;
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                cafeId: string;
                name: string;
                categoryId: string;
                description: string | null;
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
        customerName: string | null;
        status: string;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        createdAt: Date;
        updatedAt: Date;
        cafeId: string;
        tableId: string | null;
    }>;
    findAll(cafeId: string): import("@prisma/client").Prisma.PrismaPromise<({
        table: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            cafeId: string;
            tableNumber: number;
            isOccupied: boolean;
            lastOccupiedAt: Date | null;
        } | null;
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                cafeId: string;
                name: string;
                categoryId: string;
                description: string | null;
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
        customerName: string | null;
        status: string;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        createdAt: Date;
        updatedAt: Date;
        cafeId: string;
        tableId: string | null;
    })[]>;
    updateStatus(id: string, status: string): Promise<{
        table: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            cafeId: string;
            tableNumber: number;
            isOccupied: boolean;
            lastOccupiedAt: Date | null;
        } | null;
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                cafeId: string;
                name: string;
                categoryId: string;
                description: string | null;
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
        customerName: string | null;
        status: string;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        createdAt: Date;
        updatedAt: Date;
        cafeId: string;
        tableId: string | null;
    }>;
    closeTable(tableId: string): Promise<{
        message: string;
        totalAmount: number;
    }>;
}
