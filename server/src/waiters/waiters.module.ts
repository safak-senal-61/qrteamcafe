import { Module } from '@nestjs/common';
import { WaitersService } from './waiters.service';
import { WaitersController } from './waiters.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventsModule } from '../events/events.module';
import { MailService } from '../common/mail.service';

@Module({
  imports: [
    PrismaModule,
    EventsModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'super-secret-key',
        signOptions: { expiresIn: '12h' }, // Waiter shift length approx
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [WaitersController],
  providers: [WaitersService, MailService],
  exports: [WaitersService],
})
export class WaitersModule {}
