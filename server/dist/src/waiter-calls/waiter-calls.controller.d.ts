import { WaiterCallsService } from './waiter-calls.service';
import { CreateWaiterCallDto } from './dto/create-waiter-call.dto';
export declare class WaiterCallsController {
    private readonly waiterCallsService;
    constructor(waiterCallsService: WaiterCallsService);
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
