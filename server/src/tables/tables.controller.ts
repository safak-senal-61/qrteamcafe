import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
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
    @Request() req: any,
    @Body() createTableDto: CreateTableDto,
    @Query('cafeId') cafeId: string,
  ) {
    const actorId = req.user.id as string;
    const actorType = req.user.type === 'waiter' ? 'WAITER' : 'ADMIN';
    return this.tablesService.create(
      cafeId,
      createTableDto,
      actorId,
      actorType,
    );
  }

  @Post('move')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  moveTable(
    @Request() req: any,
    @Query('cafeId') cafeId: string,
    @Body() body: { fromTableId: string; toTableId: string },
  ) {
    const actorId = req.user.id as string;
    const actorType = req.user.type === 'waiter' ? 'WAITER' : 'ADMIN';
    return this.tablesService.moveTable(
      cafeId,
      body.fromTableId,
      body.toTableId,
      actorId,
      actorType,
    );
  }

  @Get()
  findAll(@Query('cafeId') cafeId: string) {
    return this.tablesService.findAll(cafeId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  remove(@Request() req: any, @Param('id') id: string) {
    const actorId = req.user.id as string;
    const actorType = req.user.type === 'waiter' ? 'WAITER' : 'ADMIN';
    return this.tablesService.remove(id, actorId, actorType);
  }
}
