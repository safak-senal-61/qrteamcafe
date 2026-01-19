import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  create(
    @Body() createTableDto: CreateTableDto,
    @Query('cafeId') cafeId: string,
  ) {
    return this.tablesService.create(cafeId, createTableDto);
  }

  @Post('move')
  moveTable(
    @Query('cafeId') cafeId: string,
    @Body() body: { fromTableId: string; toTableId: string },
  ) {
    return this.tablesService.moveTable(cafeId, body.fromTableId, body.toTableId);
  }

  @Get()
  findAll(@Query('cafeId') cafeId: string) {
    return this.tablesService.findAll(cafeId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}
