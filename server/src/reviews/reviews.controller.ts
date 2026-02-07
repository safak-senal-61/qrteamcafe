import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Param,
} from '@nestjs/common';
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
  findAll(
    @Query('productId') productId?: string,
    @Query('cafeId') cafeId?: string,
  ) {
    console.log('ReviewsController findAll called with:', {
      productId,
      cafeId,
    });
    if (productId) {
      return this.reviewsService.findAllByProduct(productId);
    }
    // Eğer cafeId varsa o kafenin yorumlarını getir
    if (cafeId) {
      return this.reviewsService.findAll(cafeId);
    }
    // Güvenlik: Eğer cafeId veya productId yoksa boş liste dön (tüm yorumları gösterme)
    return [];
  }

  @Patch(':id/score')
  updateScore(@Param('id') id: string, @Body('score') score: number) {
    return this.reviewsService.updateAdminScore(id, score);
  }

  @Patch(':id/reply')
  updateReply(@Param('id') id: string, @Body('reply') reply: string) {
    return this.reviewsService.updateAdminReply(id, reply);
  }

  @Patch(':id/visibility')
  toggleVisibility(
    @Param('id') id: string,
    @Body('isVisible') isVisible: boolean,
  ) {
    return this.reviewsService.toggleVisibility(id, isVisible);
  }
}
