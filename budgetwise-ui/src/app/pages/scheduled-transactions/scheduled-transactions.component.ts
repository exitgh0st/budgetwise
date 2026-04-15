import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { forkJoin } from 'rxjs';
import { Account } from '../../core/models/account.model';
import {
  RecurringFrequency,
  ScheduledTransaction,
  ScheduledTransactionStatus,
} from '../../core/models/scheduled-transaction.model';
import { Category } from '../../core/models/category.model';
import { AccountsService } from '../../core/services/accounts.service';
import { CategoriesService } from '../../core/services/categories.service';
import { CurrencyService } from '../../core/services/currency.service';
import { ScheduledTransactionsService } from '../../core/services/scheduled-transactions.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  ScheduledTransactionDialogComponent,
  ScheduledTransactionDialogData,
} from './scheduled-transaction-dialog/scheduled-transaction-dialog.component';
import { ScheduledTransactionsCalendarComponent } from './scheduled-transactions-calendar/scheduled-transactions-calendar.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-scheduled-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatSortModule,
    MatTableModule,
    MatChipsModule,
    MatTabsModule,
    AppCurrencyPipe,
    DatePipe,
    ScheduledTransactionsCalendarComponent,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './scheduled-transactions.component.html',
  styleUrl: './scheduled-transactions.component.scss',
})
export class ScheduledTransactionsComponent implements OnInit {
  private scheduledTransactionsService = inject(ScheduledTransactionsService);
  private accountsService = inject(AccountsService);
  private categoriesService = inject(CategoriesService);
  private currencyService = inject(CurrencyService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private breakpointObserver = inject(BreakpointObserver);
  private readonly dateFormatter = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  scheduledTransactions: ScheduledTransaction[] = [];
  expenseScheduledTransactions: ScheduledTransaction[] = [];
  incomeScheduledTransactions: ScheduledTransaction[] = [];
  loading = false;
  isMobile = false;
  processingIds = new Set<string>();
  activeTabIndex = 0;
  expenseFilters = this.createDefaultFilters();
  incomeFilters = this.createDefaultFilters();

  accounts: Account[] = [];
  categories: Category[] = [];
  sortState: Sort = { active: 'nextDueDate', direction: 'asc' };

  expenseAccountSearchCtrl = new FormControl('');
  expenseCategorySearchCtrl = new FormControl('');
  incomeAccountSearchCtrl = new FormControl('');
  incomeCategorySearchCtrl = new FormControl('');

  get expenseFilteredAccounts(): Account[] {
    const s = (this.expenseAccountSearchCtrl.value || '').toLowerCase();
    return s ? this.accounts.filter(a => a.name.toLowerCase().includes(s)) : this.accounts;
  }

  get expenseFilteredCategories(): Category[] {
    const s = (this.expenseCategorySearchCtrl.value || '').toLowerCase();
    return s ? this.categories.filter(c => c.name.toLowerCase().includes(s)) : this.categories;
  }

  get incomeFilteredAccounts(): Account[] {
    const s = (this.incomeAccountSearchCtrl.value || '').toLowerCase();
    return s ? this.accounts.filter(a => a.name.toLowerCase().includes(s)) : this.accounts;
  }

  get incomeFilteredCategories(): Category[] {
    const s = (this.incomeCategorySearchCtrl.value || '').toLowerCase();
    return s ? this.categories.filter(c => c.name.toLowerCase().includes(s)) : this.categories;
  }

  displayedColumns = [
    'description',
    'amount',
    'frequency',
    'status',
    'account',
    'category',
    'nextDueDate',
    'actions',
  ];

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe((result) => {
      this.isMobile = result.matches;
    });
    this.loadScheduledTransactions();
    this.loadDropdowns();
  }

  get totalIncome(): number {
    return this.incomeScheduledTransactions.reduce(
      (sum, scheduledTransaction) => sum + scheduledTransaction.amount,
      0,
    );
  }

  get totalExpense(): number {
    return this.expenseScheduledTransactions.reduce(
      (sum, scheduledTransaction) => sum + scheduledTransaction.amount,
      0,
    );
  }

  get activeTabType(): 'EXPENSE' | 'INCOME' {
    return this.activeTabIndex === 1 ? 'INCOME' : 'EXPENSE';
  }

  loadScheduledTransactions() {
    this.loading = true;
    this.scheduledTransactionsService.getAll().subscribe({
      next: (scheduledTransactions) => {
        this.scheduledTransactions = scheduledTransactions;
        this.loading = false;
        this.applyFilters();
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message || 'Failed to load scheduled transactions',
          'Dismiss',
          { duration: 3000 },
        );
        this.loading = false;
      },
    });
  }

  loadDropdowns() {
    forkJoin({
      accounts: this.accountsService.getAll(),
      categories: this.categoriesService.getAll(),
    }).subscribe({
      next: ({ accounts, categories }) => {
        this.accounts = accounts;
        this.categories = categories.filter((category) => !category.isSystem);
      },
      error: () => {
        this.snackBar.open(
          'Failed to load scheduled transaction filters',
          'Dismiss',
          { duration: 3000 },
        );
      },
    });
  }

  applyFilters() {
    this.expenseScheduledTransactions =
      this.filterScheduledTransactions('EXPENSE');
    this.incomeScheduledTransactions =
      this.filterScheduledTransactions('INCOME');
  }

  onFilterChange() {
    this.applyFilters();
  }

  onSortChange(sort: Sort) {
    this.sortState = {
      active: sort.active || 'nextDueDate',
      direction: sort.direction || 'asc',
    };
    this.expenseScheduledTransactions = this.sortScheduledTransactions(
      this.expenseScheduledTransactions,
    );
    this.incomeScheduledTransactions = this.sortScheduledTransactions(
      this.incomeScheduledTransactions,
    );
  }

  onTabChange(index: number) {
    this.activeTabIndex = index;
  }

  clearFilters(type: 'EXPENSE' | 'INCOME' = this.activeTabType) {
    if (type === 'EXPENSE') {
      this.expenseFilters = this.createDefaultFilters();
    } else {
      this.incomeFilters = this.createDefaultFilters();
    }
    this.applyFilters();
  }

  getSummaryFilterSuffix(type: 'EXPENSE' | 'INCOME'): string {
    const filters = this.getFilters(type);
    const activeFilters: string[] = [];

    if (filters.searchQuery.trim()) {
      activeFilters.push(`Search: ${filters.searchQuery.trim()}`);
    }

    if (filters.filterAccountId) {
      const account = this.accounts.find(
        (item) => item.id === filters.filterAccountId,
      );
      if (account) {
        activeFilters.push(`Account: ${account.name}`);
      }
    }

    if (filters.filterCategoryId) {
      const category = this.categories.find(
        (item) => item.id === filters.filterCategoryId,
      );
      if (category) {
        activeFilters.push(`Category: ${category.name}`);
      }
    }

    if (filters.filterFrequency) {
      activeFilters.push(
        `Frequency: ${this.frequencyLabel(
          filters.filterFrequency as RecurringFrequency,
        )}`,
      );
    }

    if (filters.filterStatus) {
      activeFilters.push(`Status: ${this.toTitleCase(filters.filterStatus)}`);
    }

    if (filters.filterStartDate || filters.filterEndDate) {
      activeFilters.push(this.getDateRangeLabel(type));
    }

    return activeFilters.length > 0 ? ` (${activeFilters.join(', ')})` : '';
  }

  hasFiltersFor(type: 'EXPENSE' | 'INCOME'): boolean {
    const filters = this.getFilters(type);
    return !!(
      filters.filterAccountId ||
      filters.filterCategoryId ||
      filters.filterFrequency ||
      filters.filterStatus ||
      filters.filterStartDate ||
      filters.filterEndDate ||
      filters.searchQuery
    );
  }

  openAddDialog(type: 'EXPENSE' | 'INCOME' = this.activeTabType) {
    const dialogRef = this.dialog.open(ScheduledTransactionDialogComponent, {
      width: '440px',
      data: {
        accounts: this.accounts,
        categories: this.categories,
        initialType: type,
      } as ScheduledTransactionDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.scheduledTransactionsService.create(result).subscribe({
        next: () => {
          this.snackBar.open(
            'Scheduled transaction created',
            'Dismiss',
            { duration: 3000 },
          );
          this.loadScheduledTransactions();
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.message || 'Failed to create scheduled transaction',
            'Dismiss',
            { duration: 3000 },
          );
        },
      });
    });
  }

  openEditDialog(scheduledTransaction: ScheduledTransaction) {
    const dialogRef = this.dialog.open(ScheduledTransactionDialogComponent, {
      width: '440px',
      data: {
        scheduledTransaction,
        accounts: this.accounts,
        categories: this.categories,
      } as ScheduledTransactionDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.scheduledTransactionsService
        .update(scheduledTransaction.id, result)
        .subscribe({
          next: () => {
            this.snackBar.open(
              'Scheduled transaction updated',
              'Dismiss',
              { duration: 3000 },
            );
            this.loadScheduledTransactions();
          },
          error: (err) => {
            this.snackBar.open(
              err.error?.message || 'Failed to update scheduled transaction',
              'Dismiss',
              { duration: 3000 },
            );
          },
        });
    });
  }

  confirmDelete(scheduledTransaction: ScheduledTransaction) {
    const label =
      scheduledTransaction.description ||
      scheduledTransaction.category?.name ||
      'this scheduled transaction';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete scheduled transaction',
        message: `Are you sure you want to delete "${label}"? This will not delete any transactions already generated from it.`,
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.scheduledTransactionsService.delete(scheduledTransaction.id).subscribe({
        next: () => {
          this.snackBar.open(
            'Scheduled transaction deleted',
            'Dismiss',
            { duration: 3000 },
          );
          this.loadScheduledTransactions();
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.message || 'Failed to delete scheduled transaction',
            'Dismiss',
            { duration: 3000 },
          );
        },
      });
    });
  }

  generateScheduledTransaction(scheduledTransaction: ScheduledTransaction) {
    if (this.processingIds.has(scheduledTransaction.id)) return;

    this.processingIds.add(scheduledTransaction.id);
    const label =
      scheduledTransaction.description ||
      scheduledTransaction.category?.name ||
      'this scheduled transaction';
    const direction =
      scheduledTransaction.type === 'EXPENSE' ? 'debited from' : 'credited to';
    const actionLabel =
      scheduledTransaction.type === 'EXPENSE' ? 'Pay' : 'Receive';
    const successMessage =
      scheduledTransaction.type === 'EXPENSE'
        ? 'Scheduled payment recorded'
        : 'Scheduled income recorded';
    const failureMessage =
      scheduledTransaction.type === 'EXPENSE'
        ? 'Failed to record scheduled payment'
        : 'Failed to record scheduled income';
    const amount = this.currencyService.format(scheduledTransaction.amount);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: actionLabel,
        message: `${actionLabel} "${label}" worth ${amount}? This amount will be ${direction} ${scheduledTransaction.account.name}.`,
        confirmText: actionLabel,
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        this.processingIds.delete(scheduledTransaction.id);
        return;
      }
      this.scheduledTransactionsService
        .generate(scheduledTransaction.id)
        .subscribe({
          next: () => {
            this.processingIds.delete(scheduledTransaction.id);
            this.snackBar.open(successMessage, 'Dismiss', {
              duration: 3000,
            });
            this.loadScheduledTransactions();
          },
          error: (err) => {
            this.processingIds.delete(scheduledTransaction.id);
            this.snackBar.open(
              err.error?.message || failureMessage,
              'Dismiss',
              { duration: 3000 },
            );
          },
        });
    });
  }

  isProcessing(id: string): boolean {
    return this.processingIds.has(id);
  }

  frequencyLabel(freq: RecurringFrequency): string {
    return {
      ONCE: 'One-time',
      WEEKLY: 'Weekly',
      MONTHLY: 'Monthly',
      YEARLY: 'Yearly',
    }[freq];
  }

  statusColor(
    status: ScheduledTransactionStatus,
  ): '' | 'primary' | 'accent' {
    const colors = {
      ACTIVE: 'primary',
      COMPLETED: 'accent',
      CANCELLED: '',
    } as const;
    return colors[status];
  }

  private sortScheduledTransactions(
    scheduledTransactions: ScheduledTransaction[],
  ): ScheduledTransaction[] {
    const { active, direction } = this.sortState;

    if (!active || !direction) {
      return [...scheduledTransactions];
    }

    const multiplier = direction === 'asc' ? 1 : -1;

    return [...scheduledTransactions].sort((left, right) => {
      const leftValue = this.getSortableValue(left, active);
      const rightValue = this.getSortableValue(right, active);

      if (leftValue < rightValue) {
        return -1 * multiplier;
      }

      if (leftValue > rightValue) {
        return 1 * multiplier;
      }

      return 0;
    });
  }

  private getSortableValue(
    scheduledTransaction: ScheduledTransaction,
    column: string,
  ): number | string {
    switch (column) {
      case 'description':
        return (
          scheduledTransaction.description || scheduledTransaction.category.name
        ).toLowerCase();
      case 'amount':
        return scheduledTransaction.amount;
      case 'frequency':
        return this.frequencyLabel(scheduledTransaction.frequency).toLowerCase();
      case 'status':
        return scheduledTransaction.status.toLowerCase();
      case 'account':
        return scheduledTransaction.account.name.toLowerCase();
      case 'category':
        return scheduledTransaction.category.name.toLowerCase();
      case 'nextDueDate':
        return new Date(scheduledTransaction.nextDueDate).getTime();
      default:
        return '';
    }
  }

  private filterScheduledTransactions(
    type: 'EXPENSE' | 'INCOME',
  ): ScheduledTransaction[] {
    const filters = this.getFilters(type);
    const query = filters.searchQuery.trim().toLowerCase();

    const filteredScheduledTransactions = this.scheduledTransactions.filter(
      (scheduledTransaction) => {
        if (scheduledTransaction.type !== type) return false;
        if (
          filters.filterAccountId &&
          scheduledTransaction.accountId !== filters.filterAccountId
        ) {
          return false;
        }
        if (
          filters.filterCategoryId &&
          scheduledTransaction.categoryId !== filters.filterCategoryId
        ) {
          return false;
        }
        if (
          filters.filterFrequency &&
          scheduledTransaction.frequency !== filters.filterFrequency
        ) {
          return false;
        }
        if (
          filters.filterStatus &&
          scheduledTransaction.status !== filters.filterStatus
        ) {
          return false;
        }

        const dueDate = new Date(scheduledTransaction.nextDueDate);
        dueDate.setHours(0, 0, 0, 0);

        if (filters.filterStartDate) {
          const start = new Date(filters.filterStartDate);
          start.setHours(0, 0, 0, 0);
          if (dueDate < start) return false;
        }

        if (filters.filterEndDate) {
          const end = new Date(filters.filterEndDate);
          end.setHours(0, 0, 0, 0);
          if (dueDate > end) return false;
        }

        if (!query) return true;

        return [
          scheduledTransaction.description || '',
          scheduledTransaction.account.name,
          scheduledTransaction.category.name,
        ].some((value) => value.toLowerCase().includes(query));
      },
    );

    return this.sortScheduledTransactions(filteredScheduledTransactions);
  }

  private getFilters(type: 'EXPENSE' | 'INCOME') {
    return type === 'EXPENSE' ? this.expenseFilters : this.incomeFilters;
  }

  private createDefaultFilters() {
    return {
      searchQuery: '',
      filterAccountId: '',
      filterCategoryId: '',
      filterFrequency: '',
      filterStatus: '',
      filterStartDate: null as Date | null,
      filterEndDate: null as Date | null,
    };
  }

  private getDateRangeLabel(type: 'EXPENSE' | 'INCOME'): string {
    const filters = this.getFilters(type);

    if (filters.filterStartDate && filters.filterEndDate) {
      return `From ${this.formatDateLabel(filters.filterStartDate)} to ${this.formatDateLabel(filters.filterEndDate)}`;
    }

    if (filters.filterStartDate) {
      return `From ${this.formatDateLabel(filters.filterStartDate)}`;
    }

    return `To ${this.formatDateLabel(filters.filterEndDate!)}`;
  }

  private formatDateLabel(value: Date): string {
    return this.dateFormatter.format(new Date(value));
  }

  private toTitleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}
