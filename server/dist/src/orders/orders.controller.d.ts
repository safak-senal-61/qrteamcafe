import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    findMyOrders(req: any): Promise<any[]>;
    create(cafeId: string, createOrderDto: CreateOrderDto): Promise<any>;
    findAll(cafeId: string): Promise<any[]>;
    updateStatus(id: string, status: string): Promise<any>;
    closeTable(tableId: string): Promise<{
        message: string;
        totalAmount: number;
    }>;
}
