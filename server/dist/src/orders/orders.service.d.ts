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
            qrCode: string | null;
            capacity: number | null;
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
                imageUrl: string | null;
                isAvailable: boolean;
                preparationTime: number | null;
                sortOrder: number;
                isChefRecommended: boolean;
                requiresPreparation: boolean;
                stock: number | null;
                averageRating: import("@prisma/client/runtime/library").Decimal | null;
                reviewCount: number;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            productId: string;
            orderId: string;
            options: string | null;
            note: string | null;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string | null;
        status: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        tableId: string | null;
        paymentStatus: string;
        paymentMethod: string | null;
        note: string | null;
    }>;
    findAllByCustomer(customerId: string): import("@prisma/client").Prisma.PrismaPromise<({
        reviews: {
            id: string;
            cafeId: string;
            createdAt: Date;
            updatedAt: Date;
            rating: number;
            comment: string | null;
            customerName: string | null;
            isVisible: boolean;
            isApproved: boolean;
            adminReply: string | null;
            adminScore: number | null;
            productId: string | null;
            customerId: string | null;
            orderId: string | null;
        }[];
        table: {
            id: string;
            cafeId: string;
            createdAt: Date;
            updatedAt: Date;
            isOccupied: boolean;
            tableNumber: number;
            qrCode: string | null;
            capacity: number | null;
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
                imageUrl: string | null;
                isAvailable: boolean;
                preparationTime: number | null;
                sortOrder: number;
                isChefRecommended: boolean;
                requiresPreparation: boolean;
                stock: number | null;
                averageRating: import("@prisma/client/runtime/library").Decimal | null;
                reviewCount: number;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            productId: string;
            orderId: string;
            options: string | null;
            note: string | null;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string | null;
        status: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        tableId: string | null;
        paymentStatus: string;
        paymentMethod: string | null;
        note: string | null;
    })[]>;
    findAll(cafeId: string): import("@prisma/client").Prisma.PrismaPromise<({
        reviews: {
            id: string;
            cafeId: string;
            createdAt: Date;
            updatedAt: Date;
            rating: number;
            comment: string | null;
            customerName: string | null;
            isVisible: boolean;
            isApproved: boolean;
            adminReply: string | null;
            adminScore: number | null;
            productId: string | null;
            customerId: string | null;
            orderId: string | null;
        }[];
        table: {
            id: string;
            cafeId: string;
            createdAt: Date;
            updatedAt: Date;
            isOccupied: boolean;
            tableNumber: number;
            qrCode: string | null;
            capacity: number | null;
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
                imageUrl: string | null;
                isAvailable: boolean;
                preparationTime: number | null;
                sortOrder: number;
                isChefRecommended: boolean;
                requiresPreparation: boolean;
                stock: number | null;
                averageRating: import("@prisma/client/runtime/library").Decimal | null;
                reviewCount: number;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            productId: string;
            orderId: string;
            options: string | null;
            note: string | null;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string | null;
        status: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        tableId: string | null;
        paymentStatus: string;
        paymentMethod: string | null;
        note: string | null;
    })[]>;
    updateStatus(id: string, status: string): Promise<{
        table: {
            id: string;
            cafeId: string;
            createdAt: Date;
            updatedAt: Date;
            isOccupied: boolean;
            tableNumber: number;
            qrCode: string | null;
            capacity: number | null;
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
                imageUrl: string | null;
                isAvailable: boolean;
                preparationTime: number | null;
                sortOrder: number;
                isChefRecommended: boolean;
                requiresPreparation: boolean;
                stock: number | null;
                averageRating: import("@prisma/client/runtime/library").Decimal | null;
                reviewCount: number;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            productId: string;
            orderId: string;
            options: string | null;
            note: string | null;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string | null;
        status: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        tableId: string | null;
        paymentStatus: string;
        paymentMethod: string | null;
        note: string | null;
    }>;
    closeTable(tableId: string): Promise<{
        message: string;
        totalAmount: number;
    }>;
}
