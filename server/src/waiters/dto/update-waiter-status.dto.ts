import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum WaiterStatus {
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  INACTIVE = 'INACTIVE',
}

export enum WaiterRole {
  WAITER = 'WAITER',
  CASHIER_WAITER = 'CASHIER_WAITER',
  HEAD_WAITER = 'HEAD_WAITER',
}

export class UpdateWaiterStatusDto {
  @IsEnum(WaiterStatus)
  status: WaiterStatus;

  @IsOptional()
  @IsEnum(WaiterRole)
  role?: WaiterRole;
}
