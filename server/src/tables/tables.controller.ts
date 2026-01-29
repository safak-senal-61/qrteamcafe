import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/subscription.guard';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  create(
    @Body() createTableDto: CreateTableDto,
    @Query('cafeId') cafeId: string,
  ) {
    return this.tablesService.create(cafeId, createTableDto);
  }

  @Post('move')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  moveTable(
    @Query('cafeId') cafeId: string,
    @Body() body: { fromTableId: string; toTableId: string },
  ) {
    return this.tablesService.moveTable(
      cafeId,
      body.fromTableId,
      body.toTableId,
    );
  }

  @Get()
  findAll(@Query('cafeId') cafeId: string) {
    return this.tablesService.findAll(cafeId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}
