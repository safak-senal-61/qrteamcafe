import {
  Module,
  Logger,
  OnModuleInit,
  Inject,
  MiddlewareConsumer,
  RequestMethod,
  NestModule,
} from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CafesModule } from './cafes/cafes.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { TablesModule } from './tables/tables.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { EventsModule } from './events/events.module';
import { WaiterCallsModule } from './waiter-calls/waiter-calls.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomersModule } from './customers/customers.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { IssueReportsModule } from './issue-reports/issue-reports.module';
import { VerificationModule } from './verification/verification.module';
import { ContactModule } from './contact/contact.module';
import { WaitersModule } from './waiters/waiters.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { ScheduleModule } from '@nestjs/schedule';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const logger = new Logger('RedisCache');
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
          logger.warn('Redis URL bulunamadı, hafıza önbelleği kullanılıyor');
          return {
            ttl: 300 * 1000, // 5 dakika (ms cinsinden)
          };
        }

        logger.log(`${redisUrl} adresindeki Redis sunucusuna bağlanılıyor...`);
        try {
          const store = await redisStore({
            url: redisUrl,
            ttl: 300 * 1000, // 5 dakika (ms cinsinden)
          });
          logger.log('Redis sunucusuna başarıyla bağlanıldı');
          return {
            store,
            ttl: 300 * 1000, // 5 dakika (ms cinsinden)
          };
        } catch (error) {
          logger.error(
            'Redis bağlantısı başarısız, hafıza önbelleği kullanılacak:',
            error,
          );
          return {
            ttl: 300 * 1000, // 5 dakika (ms cinsinden)
          };
        }
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests
      },
    ]),
    PrismaModule,
    AuthModule,
    CafesModule,
    CategoriesModule,
    ProductsModule,
    TablesModule,
    OrdersModule,
    PaymentsModule,
    SuperAdminModule,
    EventsModule,
    WaiterCallsModule,
    ReviewsModule,
    CustomersModule,
    LoyaltyModule,
    IssueReportsModule,
    VerificationModule,
    ContactModule,
    AuditLogsModule,
    WaitersModule,
    AnnouncementsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit, NestModule {
  private readonly logger = new Logger(AppModule.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        await this.cacheManager.set('redis_test', 'connected', 10 * 1000); // 10 saniye
        const value = await this.cacheManager.get('redis_test');
        if (value === 'connected') {
          this.logger.log(`✅ Redis bağlantısı BAŞARILI: ${redisUrl}`);
        } else {
          this.logger.error(
            '❌ Redis bağlantısı başarısız: Test verisi okunamadı.',
          );
        }
      } catch (error) {
        this.logger.error(`❌ Redis bağlantı hatası: ${error.message}`);
      }
    } else {
      this.logger.warn(
        '⚠️ Redis URL bulunamadı, hafıza (memory) cache kullanılıyor.',
      );
    }
  }
}
