import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('active')
  findActive(@Request() req: any) {
    // Determine user role
    let role: 'CAFE_ADMIN' | 'WAITER' | 'SUPER_ADMIN' = 'CAFE_ADMIN';
    if (req.user.role === 'SUPER_ADMIN') role = 'SUPER_ADMIN';
    else if (req.user.type === 'waiter') role = 'WAITER';
    else role = 'CAFE_ADMIN';

    return this.announcementsService.findAllActive(role);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: any, @Body() body: any) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only Super Admin can create announcements');
    }
    return this.announcementsService.create(
      body as {
        title: string;
        content: string;
        type?: string;
        targetRole?: string;
        expiresAt?: Date;
      },
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req: any) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Only Super Admin can list all announcements',
      );
    }
    return this.announcementsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only Super Admin can delete announcements');
    }
    return this.announcementsService.remove(id);
  }
}
