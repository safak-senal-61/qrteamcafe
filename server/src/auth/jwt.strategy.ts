import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'super-secret-key',
    });
  }

  async validate(payload: any) {
    if (payload.role === 'customer') {
      const customer = await this.prisma.customer.findUnique({
        where: { id: payload.sub },
      });
      if (!customer) {
        throw new UnauthorizedException();
      }
      return { ...customer, role: 'customer' };
    }

    // Check if session exists (for "terminate session" feature)
    if (payload.sessionId) {
      const session = await this.prisma.adminSession.findUnique({
        where: { id: payload.sessionId },
      });

      if (!session) {
        throw new UnauthorizedException('Session expired or terminated');
      }
      
      // Update last active
      // We can do this async without awaiting to not block
      this.prisma.adminSession.update({
        where: { id: payload.sessionId },
        data: { lastActive: new Date() },
      }).catch(() => {}); // ignore error
    }

    const admin = await this.prisma.cafeAdmin.findUnique({
      where: { id: payload.sub },
    });

    if (!admin) {
        // Try super admin
        const superAdmin = await this.prisma.superAdmin.findUnique({
            where: { id: payload.sub },
        });
        if(superAdmin) return { ...superAdmin, role: 'SUPER_ADMIN', sessionId: payload.sessionId };
        
        throw new UnauthorizedException();
    }

    return { ...admin, role: 'CAFE_ADMIN', sessionId: payload.sessionId };
  }
}
