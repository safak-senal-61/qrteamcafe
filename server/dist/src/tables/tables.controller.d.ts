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
