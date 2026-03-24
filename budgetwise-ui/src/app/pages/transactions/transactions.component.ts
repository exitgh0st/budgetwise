import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { TransactionsService, TransactionFilters } from '../../core/services/transactions.service';
import { AccountsService } from '../../core/services/accounts.service';
import { CategoriesService } from '../../core/services/categories.service';
import { Transaction, TransactionType } from '../../core/models/transaction.model';
import { Account } from '../../core/models/account.model';
import { Category } from '../../core/models/category.model';
import { TransactionDialogComponent, TransactionDialogData } from './transaction-dialog/transaction-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

export interface DateGroup {
  date: string;
  label: string;
  transactions: Transaction[];
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatExpansionModule,
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsComponent implements OnInit {
  private transactionsService = inject(TransactionsService);
  private accountsService = inject(AccountsService);
  private categoriesService = inject(CategoriesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private breakpointObserver = inject(BreakpointObserver);

  accounts: Account[] = [];
  categories: Category[] = [];
  dateGroups: DateGroup[] = [];
  loading = true;
  isMobile = false;
  total = 0;
  pageSize = 20;
  pageIndex = 0;

  // Filter state
  filterAccountId = '';
  filterCategoryId = '';
  filterType = '';
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
      this.pageSize = this.isMobile ? 10 : 20;
    });
    this.loadDropdowns();
    this.loadTransactions();
  }

  loadDropdowns() {
    this.accountsService.getAll().subscribe(a => this.accounts = a);
    this.categoriesService.getAll().subscribe(c => this.categories = c);
  }

  loadTransactions() {
    this.loading = true;
    const filters: TransactionFilters = {
      limit: this.pageSize,
      offset: this.pageIndex * this.pageSize,
    };
    if (this.filterAccountId) filters.accountId = this.filterAccountId;
    if (this.filterCategoryId) filters.categoryId = this.filterCategoryId;
    if (this.filterType) filters.type = this.filterType as TransactionType;
    if (this.filterStartDate) filters.startDate = this.filterStartDate.toISOString();
    if (this.filterEndDate) filters.endDate = this.filterEndDate.toISOString();

    this.transactionsService.getAll(filters).subscribe({
      next: (result) => {
        this.total = result.total;
        this.dateGroups = this.groupByDate(result.data);
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load transactions', 'Dismiss', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  onFilterChange() {
    this.pageIndex = 0;
    this.loadTransactions();
  }

  clearFilters() {
    this.filterAccountId = '';
    this.filterCategoryId = '';
    this.filterType = '';
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.onFilterChange();
  }

  get hasActiveFilters(): boolean {
    return !!(this.filterAccountId || this.filterCategoryId || this.filterType || this.filterStartDate || this.filterEndDate);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTransactions();
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(TransactionDialogComponent, {
      width: '440px',
      data: { accounts: this.accounts, categories: this.categories } as TransactionDialogData,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.transactionsService.create(result).subscribe({
          next: () => {
            this.snackBar.open('Transaction created', 'Dismiss', { duration: 3000 });
            this.loadTransactions();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to create transaction', 'Dismiss', { duration: 3000 });
          },
        });
      }
    });
  }

  openEditDialog(transaction: Transaction) {
    const dialogRef = this.dialog.open(TransactionDialogComponent, {
      width: '440px',
      data: { transaction, accounts: this.accounts, categories: this.categories } as TransactionDialogData,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.transactionsService.update(transaction.id, result).subscribe({
          next: () => {
            this.snackBar.open('Transaction updated', 'Dismiss', { duration: 3000 });
            this.loadTransactions();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to update transaction', 'Dismiss', { duration: 3000 });
          },
        });
      }
    });
  }

  confirmDelete(transaction: Transaction) {
    const label = transaction.description || transaction.category?.name || 'this transaction';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Transaction',
        message: `Are you sure you want to delete "${label}"?`,
      } as ConfirmDialogData,
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.transactionsService.delete(transaction.id).subscribe({
          next: () => {
            this.snackBar.open('Transaction deleted', 'Dismiss', { duration: 3000 });
            this.loadTransactions();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to delete transaction', 'Dismiss', { duration: 3000 });
          },
        });
      }
    });
  }

  private groupByDate(transactions: Transaction[]): DateGroup[] {
    const map = new Map<string, Transaction[]>();
    for (const t of transactions) {
      const dateKey = new Date(t.date).toLocaleDateString('en-CA'); // YYYY-MM-DD
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(t);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, txns]) => ({
        date,
        label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        }),
        transactions: txns,
      }));
  }
}
