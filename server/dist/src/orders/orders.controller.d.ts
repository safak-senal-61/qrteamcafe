import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
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
    }>;
    closeTable(tableId: string): Promise<{
        message: string;
        totalAmount: number;
    }>;
}
