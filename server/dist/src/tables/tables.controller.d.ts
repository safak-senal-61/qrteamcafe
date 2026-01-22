import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
export declare class TablesController {
    private readonly tablesService;
    constructor(tablesService: TablesService);
    create(createTableDto: CreateTableDto, cafeId: string): Promise<{
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        isOccupied: boolean;
        tableNumber: number;
        qrCode: string | null;
        capacity: number | null;
        lastOccupiedAt: Date | null;
    }>;
    moveTable(cafeId: string, body: {
        fromTableId: string;
        toTableId: string;
    }): Promise<{
        message: string;
    }>;
    findAll(cafeId: string): Promise<({
        waiterCalls: {
            id: string;
            cafeId: string;
            createdAt: Date;
            updatedAt: Date;
            type: string | null;
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
        qrCode: string | null;
        capacity: number | null;
        lastOccupiedAt: Date | null;
    })[]>;
    remove(id: string): Promise<{
        id: string;
        cafeId: string;
        createdAt: Date;
        updatedAt: Date;
        isOccupied: boolean;
        tableNumber: number;
        qrCode: string | null;
        capacity: number | null;
        lastOccupiedAt: Date | null;
    }>;
}
