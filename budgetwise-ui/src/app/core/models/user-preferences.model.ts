export type SupportedCurrencyCode =
  | 'PHP'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'KRW'
  | 'SGD'
  | 'AUD'
  | 'CAD'
  | 'INR';

export type EmailNotificationMode = 'instant' | 'daily_digest';

export interface UserPreferences {
  currency: SupportedCurrencyCode;
  emailNotifications: boolean;
  emailNotificationMode: EmailNotificationMode;
  emailDigestHour: number;
}
