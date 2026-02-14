import { IsEnum, IsOptional } from 'class-validator';
import { WaiterStatus, WaiterRole } from '../enums/waiter.enum';

export class UpdateWaiterStatusDto {
  @IsEnum(WaiterStatus)
  status: WaiterStatus;

  @IsOptional()
  @IsEnum(WaiterRole)
  role?: WaiterRole;
}
