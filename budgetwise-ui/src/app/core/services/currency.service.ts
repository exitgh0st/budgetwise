import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  SupportedCurrencyCode,
} from '../models/user-preferences.model';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

type SupportedCurrency = {
  code: SupportedCurrencyCode;
  name: string;
  symbol: string;
  locale: string;
  fractionDigits: number;
};

const DEFAULT_CURRENCY_CODE: SupportedCurrencyCode = 'PHP';

const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  {
    code: 'PHP',
    name: 'Philippine Peso',
    symbol: '₱',
    locale: 'en-PH',
    fractionDigits: 2,
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    locale: 'en-US',
    fractionDigits: 2,
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    locale: 'de-DE',
    fractionDigits: 2,
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    locale: 'en-GB',
    fractionDigits: 2,
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    locale: 'ja-JP',
    fractionDigits: 0,
  },
  {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    locale: 'ko-KR',
    fractionDigits: 0,
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    locale: 'en-SG',
    fractionDigits: 2,
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    locale: 'en-AU',
    fractionDigits: 2,
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'CA$',
    locale: 'en-CA',
    fractionDigits: 2,
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    locale: 'en-IN',
    fractionDigits: 2,
  },
] as const;

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly currencyCode = signal<SupportedCurrencyCode>(
    DEFAULT_CURRENCY_CODE,
  );
  private readonly hydratedUserId = signal<string | null>(null);

  readonly supportedCurrencies = SUPPORTED_CURRENCIES;
  readonly code = this.currencyCode.asReadonly();
  readonly selectedCurrency = computed(() =>
    this.getCurrencyDefinition(this.code()),
  );
  readonly symbol = computed(() => this.selectedCurrency().symbol);

  constructor() {
    effect(() => {
      const isLoading = this.auth.isLoading();
      const userId = this.auth.currentUser()?.id ?? null;

      if (isLoading) {
        return;
      }

      if (!userId) {
        this.hydratedUserId.set(null);
        this.currencyCode.set(DEFAULT_CURRENCY_CODE);
        return;
      }

      if (this.hydratedUserId() === userId) {
        return;
      }

      void this.hydrateFromPreferences(userId);
    });
  }

  setCurrency(code: SupportedCurrencyCode | string): void {
    this.currencyCode.set(this.normalizeCurrencyCode(code));
  }

  format(value: number | string | null | undefined): string {
    const amount = Number(value ?? 0);
    const { code, fractionDigits, locale, symbol } = this.selectedCurrency();
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });

    return formatter
      .formatToParts(Number.isFinite(amount) ? amount : 0)
      .map((part) => (part.type === 'currency' ? symbol : part.value))
      .join('');
  }

  private async hydrateFromPreferences(userId: string): Promise<void> {
    try {
      const preferences = await firstValueFrom(this.userService.getPreferences());
      this.setCurrency(preferences.currency);
    } catch {
      this.currencyCode.set(DEFAULT_CURRENCY_CODE);
    } finally {
      if (this.auth.currentUser()?.id === userId) {
        this.hydratedUserId.set(userId);
      }
    }
  }

  private normalizeCurrencyCode(
    value: string | SupportedCurrencyCode,
  ): SupportedCurrencyCode {
    return (
      SUPPORTED_CURRENCIES.find((currency) => currency.code === value)?.code ??
      DEFAULT_CURRENCY_CODE
    );
  }

  private getCurrencyDefinition(code: SupportedCurrencyCode): SupportedCurrency {
    return (
      SUPPORTED_CURRENCIES.find((currency) => currency.code === code) ??
      SUPPORTED_CURRENCIES[0]
    );
  }
}
