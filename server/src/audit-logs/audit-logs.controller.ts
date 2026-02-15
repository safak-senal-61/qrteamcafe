import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async getLogs(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('cafeId') cafeIdQuery?: string,
  ) {
    const user = req.user;

    if (user.role === 'SUPER_ADMIN') {
      // Super admin can see all logs or filter by cafeId
      return this.auditLogsService.getLogs(
        cafeIdQuery,
        limit ? +limit : 50,
        offset ? +offset : 0,
      );
    } else if (user.role === 'CAFE_ADMIN') {
      // Cafe admin can only see their own logs
      return this.auditLogsService.getLogs(
        user.cafeId as string,
        limit ? +limit : 50,
        offset ? +offset : 0,
      );
    } else {
      throw new UnauthorizedException(
        'You do not have permission to view audit logs',
      );
    }
  }
}
