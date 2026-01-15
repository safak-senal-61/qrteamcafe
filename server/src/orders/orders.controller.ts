import { Controller, Get, Post, Patch, Body, Query, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Query('cafeId') cafeId: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(cafeId, createOrderDto);
  }

  @Get()
  findAll(@Query('cafeId') cafeId: string) {
    return this.ordersService.findAll(cafeId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.updateStatus(id, status);
  }

  @Post('table/:id/pay')
  closeTable(@Param('id') tableId: string) {
    return this.ordersService.closeTable(tableId);
  }
}
