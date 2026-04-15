import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyService } from '../../core/services/currency.service';

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
