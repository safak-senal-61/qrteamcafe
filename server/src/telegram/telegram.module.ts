import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.update';
import { SuperAdminModule } from '../super-admin/super-admin.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    SuperAdminModule,
    PrismaModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_BOT_TOKEN')!,
        launchOptions: {
          dropPendingUpdates: true,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TelegramService, TelegramUpdate],
})
export class TelegramModule {}
