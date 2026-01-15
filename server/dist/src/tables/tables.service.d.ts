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
    }>;
    findAll(cafeId: string): Promise<{
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        isOccupied: boolean;
        tableNumber: number;
    }[]>;
    remove(id: string): Promise<{
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        isOccupied: boolean;
        tableNumber: number;
    }>;
}
