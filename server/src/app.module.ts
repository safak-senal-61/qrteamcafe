import { Module } from '@nestjs/common';
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
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
