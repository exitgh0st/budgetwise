import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
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
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatTooltipModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
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
  exporting = false;
  isMobile = false;
  total = 0;
  pageSize = 20;
  pageIndex = 0;

  filterAccountId = '';
  filterCategoryId = '';
  filterType = '';
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;

  accountSearchCtrl = new FormControl('');
  categorySearchCtrl = new FormControl('');

  get filteredAccounts(): Account[] {
    const s = (this.accountSearchCtrl.value || '').toLowerCase();
    return s ? this.accounts.filter(a => a.name.toLowerCase().includes(s)) : this.accounts;
  }

  get filteredCategories(): Category[] {
    const s = (this.categorySearchCtrl.value || '').toLowerCase();
    return s ? this.categories.filter(c => c.name.toLowerCase().includes(s)) : this.categories;
  }

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
    this.categoriesService.getAll().subscribe(c => {
      this.categories = c.filter(
        cat => !cat.isSystem || ['Savings', 'Debt'].includes(cat.name),
      );
    });
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
      next: result => {
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

  exportCsv() {
    this.exporting = true;

    this.transactionsService.exportAll(this.buildExportFilters()).subscribe({
      next: result => {
        const csv = this.buildCsv(result.data);
        this.downloadFile(csv, this.buildFilename());
        this.exporting = false;
        this.snackBar.open(`Exported ${result.data.length} transaction(s)`, 'Dismiss', { duration: 3000 });
      },
      error: () => {
        this.exporting = false;
        this.snackBar.open('Export failed. Please try again.', 'Dismiss', { duration: 4000 });
      },
    });
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
          error: err => {
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
          error: err => {
            this.snackBar.open(err.error?.message || 'Failed to update transaction', 'Dismiss', { duration: 3000 });
          },
        });
      }
    });
  }

  confirmDelete(transaction: Transaction) {
    const label = transaction.description || this.getCategoryLabel(transaction) || 'this transaction';
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
          error: err => {
            this.snackBar.open(err.error?.message || 'Failed to delete transaction', 'Dismiss', { duration: 3000 });
          },
        });
      }
    });
  }

  private groupByDate(transactions: Transaction[]): DateGroup[] {
    const map = new Map<string, Transaction[]>();
    for (const t of transactions) {
      const dateKey = new Date(t.date).toLocaleDateString('en-CA');
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

  getTypeLabel(type: TransactionType): string {
    switch (type) {
      case 'INCOME':
        return 'Income';
      case 'EXPENSE':
        return 'Expense';
      case 'TRANSFER':
        return 'Transfer';
    }
  }

  getCategoryLabel(transaction: Transaction): string {
    return transaction.category?.name || (transaction.type === 'TRANSFER'
      ? 'Transfer'
      : 'Uncategorized');
  }

  getDescriptionLabel(transaction: Transaction): string {
    return (
      transaction.description ||
      (transaction.type === 'TRANSFER'
        ? 'Account transfer'
        : transaction.category?.name || 'Transaction')
    );
  }

  getAccountLabel(transaction: Transaction): string {
    if (transaction.type === 'TRANSFER') {
      const fromName = transaction.fromAccount?.name || 'Unknown account';
      const toName = transaction.toAccount?.name || 'Unknown account';
      return `${fromName} -> ${toName}`;
    }

    return transaction.account?.name || 'Unknown account';
  }

  getAmountPrefix(type: TransactionType): string {
    if (type === 'INCOME') {
      return '+';
    }

    if (type === 'EXPENSE') {
      return '-';
    }

    return '';
  }

  private buildExportFilters(): Omit<TransactionFilters, 'limit' | 'offset'> {
    const filters: Omit<TransactionFilters, 'limit' | 'offset'> = {};

    if (this.filterAccountId) filters.accountId = this.filterAccountId;
    if (this.filterCategoryId) filters.categoryId = this.filterCategoryId;
    if (this.filterType) filters.type = this.filterType as TransactionType;
    if (this.filterStartDate) filters.startDate = this.filterStartDate.toISOString();
    if (this.filterEndDate) filters.endDate = this.filterEndDate.toISOString();

    return filters;
  }

  private buildCsv(transactions: Transaction[]): string {
    const headers = ['Date', 'Type', 'Amount', 'Account', 'Category', 'Description'];
    const rows = transactions.map(transaction => [
      this.formatDate(transaction.date),
      transaction.type,
      this.formatAmount(transaction.amount),
      this.getAccountExportLabel(transaction),
      this.getCategoryExportLabel(transaction),
      transaction.description ?? '',
    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));

    return [headers.join(','), ...rows].join('\r\n');
  }

  private buildFilename(): string {
    const parts = ['transactions'];

    if (this.filterStartDate) {
      parts.push(this.formatDate(this.filterStartDate));
    }

    if (this.filterEndDate) {
      parts.push(this.formatDate(this.filterEndDate));
    }

    parts.push(this.formatDate(new Date()));

    return `${parts.join('_')}.csv`;
  }

  private downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  private getAccountExportLabel(transaction: Transaction): string {
    if (transaction.type === 'TRANSFER') {
      return this.getAccountLabel(transaction);
    }

    return transaction.account?.name ?? transaction.accountId ?? 'Unknown account';
  }

  private getCategoryExportLabel(transaction: Transaction): string {
    if (transaction.type === 'TRANSFER') {
      return transaction.category?.name ?? 'Transfer';
    }

    return transaction.category?.name ?? transaction.categoryId ?? 'Uncategorized';
  }

  private formatDate(value: string | Date): string {
    return new Date(value).toLocaleDateString('en-CA');
  }

  private formatAmount(value: number | string): string {
    const amount = Number(value);

    return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
  }
}
