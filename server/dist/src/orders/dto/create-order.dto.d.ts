export declare class CreateOrderDto {
    tableId: string;
    totalAmount: number;
    items: {
        productId: string;
        quantity: number;
        price: number;
    }[];
}
