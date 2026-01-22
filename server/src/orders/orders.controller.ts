import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  findMyOrders(@Request() req: any) {
    return this.ordersService.findAllByCustomer(req.user.id);
  }

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
