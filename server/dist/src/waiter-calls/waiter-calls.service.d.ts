import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateWaiterCallDto } from './dto/create-waiter-call.dto';
export declare class WaiterCallsService {
    private prisma;
    private eventsGateway;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    create(cafeId: string, createWaiterCallDto: CreateWaiterCallDto): Promise<{
        table: {
            id: string;
            cafeId: string;
            createdAt: Date;
            updatedAt: Date;
            isOccupied: boolean;
            tableNumber: number;
            lastOccupiedAt: Date | null;
        };
    } & {
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        tableId: string;
    }>;
    findAll(cafeId: string, status?: 'PENDING' | 'COMPLETED'): Promise<({
        table: {
            id: string;
            cafeId: string;
            createdAt: Date;
            updatedAt: Date;
            isOccupied: boolean;
            tableNumber: number;
            lastOccupiedAt: Date | null;
        };
    } & {
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        tableId: string;
    })[]>;
    complete(id: string): Promise<{
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        tableId: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        tableId: string;
    }>;
}
