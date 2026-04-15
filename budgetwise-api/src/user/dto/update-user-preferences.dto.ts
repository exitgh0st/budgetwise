import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { SUPPORTED_CURRENCY_CODES } from '../currency.constants';

export const SUPPORTED_EMAIL_NOTIFICATION_MODES = [
  'instant',
  'daily_digest',
] as const;

export type EmailNotificationMode =
  (typeof SUPPORTED_EMAIL_NOTIFICATION_MODES)[number];

export class UpdateUserPreferencesDto {
  @IsOptional()
  @IsString()
  @IsIn([...SUPPORTED_CURRENCY_CODES])
  currency?: string;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsString()
  @IsIn([...SUPPORTED_EMAIL_NOTIFICATION_MODES])
  emailNotificationMode?: EmailNotificationMode;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  emailDigestHour?: number;
}
