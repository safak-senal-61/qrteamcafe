import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/subscription.guard';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  create(
    @Request() req: any,
    @Body() createCategoryDto: CreateCategoryDto,
    @Query('cafeId') cafeId: string,
  ) {
    const actorId = req.user.id as string;
    const actorType = req.user.type === 'waiter' ? 'WAITER' : 'ADMIN';
    return this.categoriesService.create(
      cafeId,
      createCategoryDto,
      actorId,
      actorType,
    );
  }

  @Get()
  findAll(@Query('cafeId') cafeId: string) {
    return this.categoriesService.findAll(cafeId);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  reorder(@Body() items: { id: string; sortOrder: number }[]) {
    // Reorder categories
    return this.categoriesService.reorder(items);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const actorId = req.user.id as string;
    const actorType = req.user.type === 'waiter' ? 'WAITER' : 'ADMIN';
    return this.categoriesService.update(
      id,
      updateCategoryDto,
      actorId,
      actorType,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  remove(@Request() req: any, @Param('id') id: string) {
    const actorId = req.user.id as string;
    const actorType = req.user.type === 'waiter' ? 'WAITER' : 'ADMIN';
    return this.categoriesService.remove(id, actorId, actorType);
  }
}
