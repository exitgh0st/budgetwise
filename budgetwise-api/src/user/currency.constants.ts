export const DEFAULT_CURRENCY_CODE = 'PHP' as const;

export const SUPPORTED_CURRENCY_CODES = [
  'PHP',
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'KRW',
  'SGD',
  'AUD',
  'CAD',
  'INR',
] as const;

export type SupportedCurrencyCode = (typeof SUPPORTED_CURRENCY_CODES)[number];

type CurrencyConfig = {
  label: string;
  locale: string;
  symbol: string;
  fractionDigits: number;
};

const CURRENCY_CONFIG: Record<SupportedCurrencyCode, CurrencyConfig> = {
  PHP: {
    label: 'Philippine Peso',
    locale: 'en-PH',
    symbol: '₱',
    fractionDigits: 2,
  },
  USD: {
    label: 'US Dollar',
    locale: 'en-US',
    symbol: '$',
    fractionDigits: 2,
  },
  EUR: {
    label: 'Euro',
    locale: 'de-DE',
    symbol: '€',
    fractionDigits: 2,
  },
  GBP: {
    label: 'British Pound',
    locale: 'en-GB',
    symbol: '£',
    fractionDigits: 2,
  },
  JPY: {
    label: 'Japanese Yen',
    locale: 'ja-JP',
    symbol: '¥',
    fractionDigits: 0,
  },
  KRW: {
    label: 'South Korean Won',
    locale: 'ko-KR',
    symbol: '₩',
    fractionDigits: 0,
  },
  SGD: {
    label: 'Singapore Dollar',
    locale: 'en-SG',
    symbol: 'S$',
    fractionDigits: 2,
  },
  AUD: {
    label: 'Australian Dollar',
    locale: 'en-AU',
    symbol: 'A$',
    fractionDigits: 2,
  },
  CAD: {
    label: 'Canadian Dollar',
    locale: 'en-CA',
    symbol: 'CA$',
    fractionDigits: 2,
  },
  INR: {
    label: 'Indian Rupee',
    locale: 'en-IN',
    symbol: '₹',
    fractionDigits: 2,
  },
};

export function isSupportedCurrencyCode(
  value: string,
): value is SupportedCurrencyCode {
  return SUPPORTED_CURRENCY_CODES.includes(value as SupportedCurrencyCode);
}

/** Returns `value` as a `SupportedCurrencyCode` if valid, otherwise returns `fallback`. */
export function normalizeCurrencyCode(
  value: unknown,
  fallback: SupportedCurrencyCode = DEFAULT_CURRENCY_CODE,
): SupportedCurrencyCode {
  return typeof value === 'string' && isSupportedCurrencyCode(value)
    ? value
    : fallback;
}

export function getCurrencyConfig(code: unknown): CurrencyConfig {
  return CURRENCY_CONFIG[normalizeCurrencyCode(code)];
}

export function describeCurrency(code: unknown): string {
  const normalized = normalizeCurrencyCode(code);
  const config = getCurrencyConfig(normalized);
  return `${config.label} (${normalized})`;
}

/**
 * Formats a monetary amount using the currency's locale and symbol.
 * Uses `formatToParts` to substitute our custom symbol (e.g. "₱") in place of
 * the ISO code text that `Intl.NumberFormat` would otherwise emit (e.g. "PHP").
 */
export function formatCurrencyAmount(amount: number, code: unknown): string {
  const normalized = normalizeCurrencyCode(code);
  const { fractionDigits, locale, symbol } = getCurrencyConfig(normalized);
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalized,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  // Replace the 'currency' part (ISO code text) with our own symbol string.
  return formatter
    .formatToParts(Number(amount))
    .map((part) => (part.type === 'currency' ? symbol : part.value))
    .join('');
}
