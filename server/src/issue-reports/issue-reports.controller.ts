import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { IssueReportsService } from './issue-reports.service';
import { CreateIssueReportDto } from './dto/create-issue-report.dto';
import { UpdateIssueReportDto } from './dto/update-issue-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('issue-reports')
export class IssueReportsController {
  constructor(private readonly issueReportsService: IssueReportsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: any, @Body() createIssueReportDto: CreateIssueReportDto) {
    console.log('Create Issue Report Request User:', req.user);
    if (!req.user.cafeId) {
      throw new Error('User does not have a cafeId associated. Role: ' + req.user.role);
    }
    return this.issueReportsService.create(req.user.cafeId, createIssueReportDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    // Ideally this should be protected by a SuperAdminGuard
    return this.issueReportsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIssueReportDto: UpdateIssueReportDto) {
    // Ideally this should be protected by a SuperAdminGuard
    return this.issueReportsService.update(id, updateIssueReportDto);
  }
}
