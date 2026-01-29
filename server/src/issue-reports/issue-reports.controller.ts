import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { IssueReportsService } from './issue-reports.service';
import { CreateIssueReportDto } from './dto/create-issue-report.dto';
import { UpdateIssueReportDto } from './dto/update-issue-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestWithUser {
  user: {
    cafeId: string;
    role: string;
    [key: string]: any;
  };
}

@Controller('issue-reports')
export class IssueReportsController {
  constructor(private readonly issueReportsService: IssueReportsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() createIssueReportDto: CreateIssueReportDto,
  ) {
    console.log('Create Issue Report Request User:', req.user);

    if (!req.user) {
      throw new UnauthorizedException('User not found in request');
    }

    if (!req.user.cafeId) {
      console.error('User missing cafeId:', req.user);
      throw new BadRequestException(
        'User does not have a cafeId associated. Role: ' + req.user.role,
      );
    }

    return this.issueReportsService.create(
      req.user.cafeId,
      createIssueReportDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    // Ideally this should be protected by a SuperAdminGuard
    return this.issueReportsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIssueReportDto: UpdateIssueReportDto,
  ) {
    // Ideally this should be protected by a SuperAdminGuard
    return this.issueReportsService.update(id, updateIssueReportDto);
  }
}
