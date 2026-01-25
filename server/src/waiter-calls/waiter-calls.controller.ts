import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  Delete,
} from '@nestjs/common';
import { WaiterCallsService } from './waiter-calls.service';
import { CreateWaiterCallDto } from './dto/create-waiter-call.dto';

@Controller('waiter-calls')
export class WaiterCallsController {
  constructor(private readonly waiterCallsService: WaiterCallsService) {}

  @Post()
  create(
    @Query('cafeId') cafeId: string,
    @Body() createWaiterCallDto: CreateWaiterCallDto,
  ) {
    return this.waiterCallsService.create(cafeId, createWaiterCallDto);
  }

  @Get()
  findAll(
    @Query('cafeId') cafeId: string,
    @Query('status') status?: 'PENDING' | 'COMPLETED',
  ) {
    return this.waiterCallsService.findAll(cafeId, status);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string) {
    return this.waiterCallsService.complete(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.waiterCallsService.remove(id);
  }
}
