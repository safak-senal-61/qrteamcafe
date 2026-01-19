import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
export declare class TablesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(cafeId: string, createTableDto: CreateTableDto): Promise<{
        id: string;
        tableNumber: number;
        isOccupied: boolean;
        lastOccupiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        cafeId: string;
    }>;
    findAll(cafeId: string): Promise<({
        waiterCalls: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            cafeId: string;
            status: string;
            tableId: string;
        }[];
    } & {
        id: string;
        tableNumber: number;
        isOccupied: boolean;
        lastOccupiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        cafeId: string;
    })[]>;
    remove(id: string): Promise<{
        id: string;
        tableNumber: number;
        isOccupied: boolean;
        lastOccupiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        cafeId: string;
    }>;
    moveTable(cafeId: string, fromTableId: string, toTableId: string): Promise<{
        message: string;
    }>;
}
