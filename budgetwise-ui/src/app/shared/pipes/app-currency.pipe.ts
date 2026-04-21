import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyService } from '../../core/services/currency.service';

/**
 * Formats a number as a currency string using the active currency from `CurrencyService`.
 * `pure: false` is required because the pipe reads a signal that can change independently
 * of the template input value (e.g. when the user updates their currency preference).
 */
@Pipe({
  name: 'appCurrency',
  standalone: true,
  pure: false,
})
export class AppCurrencyPipe implements PipeTransform {
  private readonly currencyService = inject(CurrencyService);

  transform(value: number | string | null | undefined): string {
    return this.currencyService.format(value);
  }
}
