import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum EmailTarget {
  ALL_CAFE_OWNERS = 'ALL_CAFE_OWNERS',
  ALL_USERS = 'ALL_USERS',
  EVERYONE = 'EVERYONE',
  SINGLE_CAFE = 'SINGLE_CAFE',
}

export class SendAnnouncementEmailDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(EmailTarget)
  target: EmailTarget;

  @IsString()
  @IsOptional()
  cafeId?: string;
}
