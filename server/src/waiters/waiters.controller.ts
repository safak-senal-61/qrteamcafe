import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { WaitersService } from './waiters.service';
import { LoginWaiterDto } from './dto/login-waiter.dto';
import { UpdateWaiterStatusDto } from './dto/update-waiter-status.dto';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    role: string;
    cafeId: string;
    id?: string;
    sub?: string;
  };
  headers: {
    origin?: string;
    [key: string]: any;
  };
}

@Controller('waiters')
export class WaitersController {
  constructor(private readonly waitersService: WaitersService) {}

  @Post('login')
  login(@Body() loginWaiterDto: LoginWaiterDto) {
    return this.waitersService.login(loginWaiterDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invite')
  inviteStaff(
    @Body() dto: InviteStaffDto,
    @Request() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== 'CAFE_ADMIN') {
      throw new ForbiddenException('Bu işlem için yetkiniz yok.');
    }
    const origin = req.headers.origin;
    return this.waitersService.inviteStaff(dto, req.user.cafeId, origin);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/resend-invitation')
  resendInvitation(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== 'CAFE_ADMIN') {
      throw new ForbiddenException('Bu işlem için yetkiniz yok.');
    }
    const origin = req.headers.origin;
    return this.waitersService.resendInvitation(id, req.user.cafeId, origin);
  }

  @Post('verify-invitation')
  verifyInvitation(@Body() body: { token: string }) {
    return this.waitersService.verifyInvitationToken(body.token);
  }

  @Post('complete-registration')
  completeRegistration(@Body() dto: CompleteRegistrationDto) {
    return this.waitersService.completeRegistration(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    // Only CafeAdmin should access this
    if (req.user.role !== 'CAFE_ADMIN') {
      throw new ForbiddenException('Bu işlem için yetkiniz yok.');
    }
    return this.waitersService.findAll(req.user.cafeId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateWaiterStatusDto: UpdateWaiterStatusDto,
    @Request() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== 'CAFE_ADMIN') {
      throw new ForbiddenException('Bu işlem için yetkiniz yok.');
    }
    return this.waitersService.updateStatus(
      id,
      updateWaiterStatusDto,
      req.user.cafeId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteWaiter(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'CAFE_ADMIN') {
      throw new ForbiddenException('Bu işlem için yetkiniz yok.');
    }
    return this.waitersService.deleteInvitation(id, req.user.cafeId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.waitersService.findOne((req.user.id || req.user.sub)!);
  }
}
