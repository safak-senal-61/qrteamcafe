import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventsGateway } from '../events/events.gateway';
import { Category } from '@prisma/client';
export declare class OrdersService {
    private prisma;
    private eventsGateway;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    private mapOrderWithImages;
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
                category: {
                    id: string;
                    cafeId: string;
                    name: string;
                    sortOrder: number;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                };
            } & {
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
        deliveredAt: Date | null;
    } & {
        items: {
            product: {
                imageUrl: string;
                id: string;
                cafeId: string;
                categoryId: string;
                name: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                originalPrice: import("@prisma/client/runtime/library").Decimal | null;
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
                category: Category | null;
            } | null;
            id: string;
            productId: string;
            orderId: string;
            options: string | null;
            note: string | null;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        }[];
    }>;
    findAllByCustomer(customerId: string): Promise<({
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
                category: {
                    id: string;
                    cafeId: string;
                    name: string;
                    sortOrder: number;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                };
            } & {
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
        deliveredAt: Date | null;
    } & {
        items: {
            product: {
                imageUrl: string;
                id: string;
                cafeId: string;
                categoryId: string;
                name: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                originalPrice: import("@prisma/client/runtime/library").Decimal | null;
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
                category: Category | null;
            } | null;
            id: string;
            productId: string;
            orderId: string;
            options: string | null;
            note: string | null;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        }[];
    })[]>;
    findAll(cafeId: string): Promise<({
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
                category: {
                    id: string;
                    cafeId: string;
                    name: string;
                    sortOrder: number;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                };
            } & {
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
        deliveredAt: Date | null;
    } & {
        items: {
            product: {
                imageUrl: string;
                id: string;
                cafeId: string;
                categoryId: string;
                name: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                originalPrice: import("@prisma/client/runtime/library").Decimal | null;
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
                category: Category | null;
            } | null;
            id: string;
            productId: string;
            orderId: string;
            options: string | null;
            note: string | null;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        }[];
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
                category: {
                    id: string;
                    cafeId: string;
                    name: string;
                    sortOrder: number;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                };
            } & {
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
        deliveredAt: Date | null;
    } & {
        items: {
            product: {
                imageUrl: string;
                id: string;
                cafeId: string;
                categoryId: string;
                name: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                originalPrice: import("@prisma/client/runtime/library").Decimal | null;
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
                category: Category | null;
            } | null;
            id: string;
            productId: string;
            orderId: string;
            options: string | null;
            note: string | null;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        }[];
    }>;
    closeTable(tableId: string): Promise<{
        message: string;
        totalAmount: number;
    }>;
}
