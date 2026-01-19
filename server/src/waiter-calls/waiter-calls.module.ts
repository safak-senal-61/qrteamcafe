import { Module } from '@nestjs/common';
import { WaiterCallsService } from './waiter-calls.service';
import { WaiterCallsController } from './waiter-calls.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [WaiterCallsController],
  providers: [WaiterCallsService],
})
export class WaiterCallsModule {}
