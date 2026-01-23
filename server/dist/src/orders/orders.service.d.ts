import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventsGateway } from '../events/events.gateway';
export declare class OrdersService {
    private prisma;
    private eventsGateway;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    private mapOrderWithImages;
    create(cafeId: string, createOrderDto: CreateOrderDto): Promise<any>;
    findAllByCustomer(customerId: string): Promise<any[]>;
    findAll(cafeId: string): Promise<any[]>;
    updateStatus(id: string, status: string): Promise<any>;
    closeTable(tableId: string): Promise<{
        message: string;
        totalAmount: number;
    }>;
}
