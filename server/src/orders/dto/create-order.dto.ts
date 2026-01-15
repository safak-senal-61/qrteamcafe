export class CreateOrderDto {
  tableId: string;
  totalAmount: number;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
}
