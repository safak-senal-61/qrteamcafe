import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventsGateway } from '../events/events.gateway';
export declare class OrdersService {
    private prisma;
    private eventsGateway;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
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
                isChefRecommended: boolean;
                averageRating: import("@prisma/client/runtime/library").Decimal;
                reviewCount: number;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            orderId: string;
            productId: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        customerName: string | null;
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
                isChefRecommended: boolean;
                averageRating: import("@prisma/client/runtime/library").Decimal;
                reviewCount: number;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            orderId: string;
            productId: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        customerName: string | null;
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
                isChefRecommended: boolean;
                averageRating: import("@prisma/client/runtime/library").Decimal;
                reviewCount: number;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            orderId: string;
            productId: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        customerName: string | null;
        status: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        tableId: string | null;
    }>;
    closeTable(tableId: string): Promise<{
        message: string;
        totalAmount: number;
    }>;
}
