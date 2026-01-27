import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIssueReportDto } from './dto/create-issue-report.dto';
import { UpdateIssueReportDto } from './dto/update-issue-report.dto';

@Injectable()
export class IssueReportsService {
  constructor(private prisma: PrismaService) {}

  async create(cafeId: string, dto: CreateIssueReportDto) {
    return this.prisma.issueReport.create({
      data: {
        cafeId,
        ...dto,
      },
    });
  }

  async findAll() {
    return this.prisma.issueReport.findMany({
      include: {
        cafe: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: string, dto: UpdateIssueReportDto) {
    return this.prisma.issueReport.update({
      where: { id },
      data: dto,
    });
  }
}
