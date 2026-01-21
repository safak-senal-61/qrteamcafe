import { Controller, Post, Body, Get, Query, Patch, Param } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

// Controller for managing reviews
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  findAll(@Query('productId') productId?: string) {
    if (productId) {
      return this.reviewsService.findAllByProduct(productId);
    }
    return this.reviewsService.findAll();
  }

  @Patch(':id/score')
  updateScore(@Param('id') id: string, @Body('score') score: number) {
    return this.reviewsService.updateAdminScore(id, score);
  }

  @Patch(':id/reply')
  updateReply(@Param('id') id: string, @Body('reply') reply: string) {
    return this.reviewsService.updateAdminReply(id, reply);
  }
}
