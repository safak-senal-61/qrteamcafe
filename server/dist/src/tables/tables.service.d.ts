import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
export declare class TablesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(cafeId: string, createTableDto: CreateTableDto): Promise<{
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        isOccupied: boolean;
        tableNumber: number;
        lastOccupiedAt: Date | null;
    }>;
    findAll(cafeId: string): Promise<({
        waiterCalls: {
            id: string;
            cafeId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            tableId: string;
        }[];
    } & {
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        isOccupied: boolean;
        tableNumber: number;
        lastOccupiedAt: Date | null;
    })[]>;
    remove(id: string): Promise<{
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        isOccupied: boolean;
        tableNumber: number;
        lastOccupiedAt: Date | null;
    }>;
    moveTable(cafeId: string, fromTableId: string, toTableId: string): Promise<{
        message: string;
    }>;
}
