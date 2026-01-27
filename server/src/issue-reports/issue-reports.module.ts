import { Module } from '@nestjs/common';
import { IssueReportsService } from './issue-reports.service';
import { IssueReportsController } from './issue-reports.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [IssueReportsController],
  providers: [IssueReportsService],
})
export class IssueReportsModule {} // Module for handling issue reports
