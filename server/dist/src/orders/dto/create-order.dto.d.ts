export declare class CreateOrderDto {
    tableId?: string;
    customerId?: string;
    totalAmount?: number;
    items: {
        productId: string;
        quantity: number;
        unitPrice: number;
        note?: string;
    }[];
}
