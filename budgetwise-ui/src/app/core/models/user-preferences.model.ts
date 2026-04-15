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

export interface UserPreferences {
  currency: SupportedCurrencyCode;
}
