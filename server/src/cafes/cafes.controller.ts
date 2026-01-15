import { Controller, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { CafesService } from './cafes.service';

@Controller('cafes')
export class CafesController {
  constructor(private readonly cafesService: CafesService) {}

  @Get('my-stats')
  getStats(@Query('cafeId') cafeId: string) {
    return this.cafesService.getDashboardStats(cafeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cafesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.cafesService.update(id, body);
  }
}
