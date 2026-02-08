import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { AuthModule } from '../auth/auth.module';
import { S3Service } from '../common/s3.service';

@Module({
  imports: [AuthModule],
  controllers: [CustomersController],
  providers: [CustomersService, S3Service],
})
export class CustomersModule {}
