import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
export declare class TablesController {
    private readonly tablesService;
    constructor(tablesService: TablesService);
    create(createTableDto: CreateTableDto, cafeId: string): Promise<{
        id: string;
        tableNumber: number;
        isOccupied: boolean;
        lastOccupiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        cafeId: string;
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
}
