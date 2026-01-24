import { IsBoolean, IsEmail, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateCafeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @ValidateIf((o) => o.email !== '')
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  authorizedPerson?: string;

  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @IsString()
  workingHours?: string;

  @IsOptional()
  preparationTime?: string | number;

  @IsOptional()
  @IsString()
  paymentMethods?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  googleMapsUrl?: string;

  @IsOptional()
  @IsBoolean()
  showProductRatings?: boolean;

  @IsOptional()
  @IsBoolean()
  autoApproveReviews?: boolean;

  @IsOptional()
  @IsBoolean()
  isSoundEnabled?: boolean;

  // New Settings
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  brandColor?: string;

  @IsOptional()
  @IsString()
  menuViewMode?: string;

  @IsOptional()
  @IsString()
  welcomeMessage?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @IsOptional()
  @IsString()
  twitterUrl?: string;

  @IsOptional()
  @IsString()
  wifiSsid?: string;

  @IsOptional()
  @IsString()
  wifiPassword?: string;

  @IsOptional()
  @IsString()
  waiterCallOptions?: string;

  @IsOptional()
  @IsBoolean()
  isMaintenanceMode?: boolean;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  themeConfig?: string;
}
