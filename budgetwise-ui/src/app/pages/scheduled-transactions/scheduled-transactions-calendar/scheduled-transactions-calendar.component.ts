import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CalendarEvent, CalendarModule } from 'angular-calendar';
import {
  addDays,
  addMonths,
  addYears,
  endOfMonth,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  setDate,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { Subject, map } from 'rxjs';
import { Account } from '../../../core/models/account.model';
import { Category } from '../../../core/models/category.model';
import {
  RecurringFrequency,
  ScheduledTransaction,
} from '../../../core/models/scheduled-transaction.model';
import { AccountsService } from '../../../core/services/accounts.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ScheduledTransactionsService } from '../../../core/services/scheduled-transactions.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  ScheduledTransactionDialogComponent,
  ScheduledTransactionDialogData,
} from '../scheduled-transaction-dialog/scheduled-transaction-dialog.component';
import {
  ScheduledTransactionsDaySheetAction,
  ScheduledTransactionsDaySheetComponent,
  ScheduledTransactionsDaySheetData,
} from './scheduled-transactions-day-sheet.component';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';

type ScheduledTransactionCalendarEvent = CalendarEvent<{
  record: ScheduledTransaction;
}>;

@Component({
  selector: 'app-scheduled-transactions-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AppCurrencyPipe,
    DatePipe,
    CalendarModule,
    MatBottomSheetModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
  ],
  templateUrl: './scheduled-transactions-calendar.component.html',
  styleUrl: './scheduled-transactions-calendar.component.scss',
})
export class ScheduledTransactionsCalendarComponent {
  private readonly scheduledTransactionsService = inject(
    ScheduledTransactionsService,
  );
  private readonly accountsService = inject(AccountsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly currencyService = inject(CurrencyService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly today = new Date();
  readonly refresh = new Subject<void>();
  readonly viewDate = signal(startOfMonth(new Date()));
  readonly records = signal<ScheduledTransaction[]>([]);
  readonly loading = signal(false);
  readonly selectedDay = signal<Date | null>(null);
  readonly accounts = signal<Account[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly isMobile = toSignal(
    this.breakpointObserver
      .observe('(max-width: 599px)')
      .pipe(map(result => result.matches)),
    { initialValue: false },
  );

  readonly events = computed<ScheduledTransactionCalendarEvent[]>(() =>
    this.projectMonth(this.records(), this.viewDate()),
  );

  readonly selectedDayRecords = computed(() => {
    const selectedDay = this.selectedDay();
    if (!selectedDay) {
      return [];
    }

    return this.events()
      .filter(event => event.meta && isSameDay(event.start, selectedDay))
      .map(event => event.meta!.record);
  });

  readonly selectedDayLabel = computed(() => {
    const selectedDay = this.selectedDay();
    return selectedDay ? startOfDay(selectedDay) : null;
  });

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    this.scheduledTransactionsService.getAll().subscribe({
      next: records => {
        this.records.set(records);
        this.loading.set(false);
        this.syncSelectedDay();
        this.refresh.next();
      },
      error: err => {
        this.loading.set(false);
        this.snackBar.open(
          err.error?.message || 'Failed to load scheduled transactions',
          'Dismiss',
          { duration: 3000 },
        );
      },
    });

    this.accountsService.getAll().subscribe({
      next: accounts => this.accounts.set(accounts),
      error: () => {
        this.snackBar.open(
          'Failed to load accounts for calendar editing',
          'Dismiss',
          {
            duration: 3000,
          },
        );
      },
    });

    this.categoriesService.getAll().subscribe({
      next: categories =>
        this.categories.set(categories.filter(category => !category.isSystem)),
      error: () => {
        this.snackBar.open(
          'Failed to load categories for calendar editing',
          'Dismiss',
          {
            duration: 3000,
          },
        );
      },
    });
  }

  goToPreviousMonth(): void {
    this.viewDate.set(startOfMonth(subMonths(this.viewDate(), 1)));
    this.syncSelectedDay();
    this.refresh.next();
  }

  goToNextMonth(): void {
    this.viewDate.set(startOfMonth(addMonths(this.viewDate(), 1)));
    this.syncSelectedDay();
    this.refresh.next();
  }

  goToToday(): void {
    this.viewDate.set(startOfMonth(this.today));
    this.selectedDay.set(startOfDay(this.today));
    this.refresh.next();
  }

  dayClicked(day: {
    date: Date;
    events: ScheduledTransactionCalendarEvent[];
  }): void {
    if (day.events.length === 0) {
      this.selectedDay.set(null);
      this.refresh.next();
      return;
    }

    this.selectedDay.set(startOfDay(day.date));
    this.refresh.next();

    if (this.isMobile()) {
      const records = day.events
        .filter(event => event.meta)
        .map(event => event.meta!.record);
      const bottomSheetRef = this.bottomSheet.open<
        ScheduledTransactionsDaySheetComponent,
        ScheduledTransactionsDaySheetData,
        ScheduledTransactionsDaySheetAction | undefined
      >(ScheduledTransactionsDaySheetComponent, {
        data: {
          date: day.date,
          records,
        },
      });

      bottomSheetRef.afterDismissed().subscribe(result => {
        if (!result) {
          return;
        }

        if (result.action === 'edit') {
          this.openEditDialog(result.record);
        } else {
          this.confirmDelete(result.record);
        }
      });
    }
  }

  beforeMonthViewRender(event: {
    body: Array<{
      date: Date;
      events: ScheduledTransactionCalendarEvent[];
      cssClass?: string;
    }>;
  }): void {
    for (const cell of event.body) {
      const cssClasses: string[] = [];
      const hasIncome = cell.events.some(
        calendarEvent => calendarEvent.meta?.record.type === 'INCOME',
      );
      const hasExpense = cell.events.some(
        calendarEvent => calendarEvent.meta?.record.type === 'EXPENSE',
      );

      if (hasIncome && hasExpense) {
        cssClasses.push('cal-day-mixed');
      } else if (hasIncome) {
        cssClasses.push('cal-day-income');
      } else if (hasExpense) {
        cssClasses.push('cal-day-expense');
      }

      if (
        this.selectedDay() &&
        isSameDay(cell.date, this.selectedDay()!)
      ) {
        cssClasses.push('cal-day-selected');
      }

      cell.cssClass = cssClasses.join(' ');
    }
  }

  openEditDialog(record: ScheduledTransaction): void {
    const dialogRef = this.dialog.open(ScheduledTransactionDialogComponent, {
      width: '440px',
      data: {
        scheduledTransaction: record,
        accounts: this.accounts(),
        categories: this.categories(),
      } as ScheduledTransactionDialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      this.scheduledTransactionsService.update(record.id, result).subscribe({
        next: () => {
          this.snackBar.open('Scheduled transaction updated', 'Dismiss', {
            duration: 3000,
          });
          this.loadData();
        },
        error: err => {
          this.snackBar.open(
            err.error?.message || 'Failed to update scheduled transaction',
            'Dismiss',
            { duration: 3000 },
          );
        },
      });
    });
  }

  confirmDelete(record: ScheduledTransaction): void {
    const label =
      record.description || record.category?.name || 'this scheduled transaction';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete scheduled transaction',
        message: `Are you sure you want to delete "${label}"? This will not delete any transactions already generated from it.`,
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.scheduledTransactionsService.delete(record.id).subscribe({
        next: () => {
          this.snackBar.open('Scheduled transaction deleted', 'Dismiss', {
            duration: 3000,
          });
          this.loadData();
        },
        error: err => {
          this.snackBar.open(
            err.error?.message || 'Failed to delete scheduled transaction',
            'Dismiss',
            { duration: 3000 },
          );
        },
      });
    });
  }

  clearSelectedDay(): void {
    this.selectedDay.set(null);
    this.refresh.next();
  }

  private projectMonth(
    records: ScheduledTransaction[],
    viewDate: Date,
  ): ScheduledTransactionCalendarEvent[] {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    const events: ScheduledTransactionCalendarEvent[] = [];

    for (const record of records) {
      if (record.status !== 'ACTIVE') {
        continue;
      }

      let occurrence = startOfDay(new Date(record.nextDueDate));

      while (!isAfter(occurrence, end)) {
        if (!isBefore(occurrence, start)) {
          events.push({
            start: occurrence,
            title: `${record.description || record.category.name} - ${this.formatCurrency(record.amount)}`,
            color:
              record.type === 'INCOME'
                ? { primary: '#4CAF50', secondary: '#C8E6C9' }
                : { primary: '#F44336', secondary: '#FFCDD2' },
            meta: { record },
          });
        }

        if (record.frequency === 'ONCE') {
          break;
        }

        occurrence = this.advanceDate(occurrence, record.frequency);
      }
    }

    return events;
  }

  private advanceDate(date: Date, frequency: RecurringFrequency): Date {
    switch (frequency) {
      case 'WEEKLY':
        return addDays(date, 7);
      case 'MONTHLY':
        return this.addMonthWithClamp(date);
      case 'YEARLY':
        return this.addYearWithClamp(date);
      case 'ONCE':
      default:
        return date;
    }
  }

  private addMonthWithClamp(date: Date): Date {
    const nextMonth = addMonths(date, 1);
    const originalDay = date.getDate();
    const lastDayOfMonth = endOfMonth(nextMonth).getDate();
    return setDate(nextMonth, Math.min(originalDay, lastDayOfMonth));
  }

  private addYearWithClamp(date: Date): Date {
    const nextYear = addYears(date, 1);
    const originalDay = date.getDate();
    const lastDayOfMonth = endOfMonth(nextYear).getDate();
    return setDate(nextYear, Math.min(originalDay, lastDayOfMonth));
  }

  private syncSelectedDay(): void {
    const selectedDay = this.selectedDay();
    if (!selectedDay) {
      return;
    }

    if (!isSameMonth(selectedDay, this.viewDate())) {
      this.selectedDay.set(null);
      this.refresh.next();
    }
  }

  private formatCurrency(amount: number): string {
    return this.currencyService.format(Number(amount));
  }
}
