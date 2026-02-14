export class CreateOrderDto {
  tableId?: string;
  customerId?: string;
  waiterId?: string;
  totalAmount?: number; // Optional, can be calculated by backend
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    note?: string;
  }[];
}
