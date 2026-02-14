import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { WaiterRole } from '../enums/waiter.enum';

export class InviteStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEnum(WaiterRole)
  role: WaiterRole;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (value === '' ? null : value))
  phone?: string;
}
