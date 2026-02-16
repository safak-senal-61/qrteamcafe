import { Module } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminMailService } from './super-admin-mail.service';

@Module({
  controllers: [SuperAdminController],
  providers: [SuperAdminService, SuperAdminMailService],
  exports: [SuperAdminService, SuperAdminMailService],
})
export class SuperAdminModule {}
