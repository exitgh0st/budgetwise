import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { Bill, BillStatus, RecurringFrequency } from '../../core/models/bill.model';
import { Category } from '../../core/models/category.model';
import { AccountsService } from '../../core/services/accounts.service';
import { BillsService } from '../../core/services/bills.service';
import { CategoriesService } from '../../core/services/categories.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { BillDialogComponent, BillDialogData } from './bill-dialog/bill-dialog.component';

@Component({
  selector: 'app-bills',
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
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './bills.component.html',
  styleUrl: './bills.component.scss',
})
export class BillsComponent implements OnInit {
  private billsService = inject(BillsService);
  private accountsService = inject(AccountsService);
  private categoriesService = inject(CategoriesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private breakpointObserver = inject(BreakpointObserver);
  private readonly dateFormatter = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  bills: Bill[] = [];
  expenseBills: Bill[] = [];
  incomeBills: Bill[] = [];
  loading = false;
  isMobile = false;
  payingIds = new Set<string>();
  activeTabIndex = 0;
  expenseFilters = this.createDefaultFilters();
  incomeFilters = this.createDefaultFilters();

  accounts: Account[] = [];
  categories: Category[] = [];
  sortState: Sort = { active: 'nextDueDate', direction: 'asc' };

  displayedColumns = ['description', 'amount', 'frequency', 'status', 'account', 'category', 'nextDueDate', 'actions'];

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });
    this.loadBills();
    this.loadDropdowns();
  }

  get totalIncome(): number {
    return this.incomeBills.reduce((sum, b) => sum + Number(b.amount), 0);
  }

  get totalExpense(): number {
    return this.expenseBills.reduce((sum, b) => sum + Number(b.amount), 0);
  }

  get netAmount(): number {
    return this.totalIncome - this.totalExpense;
  }

  get activeTabType(): 'EXPENSE' | 'INCOME' {
    return this.activeTabIndex === 1 ? 'INCOME' : 'EXPENSE';
  }

  loadBills() {
    this.loading = true;
    this.billsService.getAll().subscribe({
      next: bills => {
        this.bills = bills;
        this.loading = false;
        this.applyFilters();
      },
      error: err => {
        this.snackBar.open(err.error?.message || 'Failed to load bills', 'Dismiss', { duration: 3000 });
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
        this.categories = categories.filter(category => !category.isSystem);
      },
      error: () => {
        this.snackBar.open('Failed to load bill filters', 'Dismiss', { duration: 3000 });
      },
    });
  }

  applyFilters() {
    this.expenseBills = this.filterBills('EXPENSE');
    this.incomeBills = this.filterBills('INCOME');
  }

  onFilterChange() {
    this.applyFilters();
  }

  onSortChange(sort: Sort) {
    this.sortState = {
      active: sort.active || 'nextDueDate',
      direction: sort.direction || 'asc',
    };
    this.expenseBills = this.sortBills(this.expenseBills);
    this.incomeBills = this.sortBills(this.incomeBills);
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
      const account = this.accounts.find(item => item.id === filters.filterAccountId);
      if (account) {
        activeFilters.push(`Account: ${account.name}`);
      }
    }

    if (filters.filterCategoryId) {
      const category = this.categories.find(item => item.id === filters.filterCategoryId);
      if (category) {
        activeFilters.push(`Category: ${category.name}`);
      }
    }

    if (filters.filterFrequency) {
      activeFilters.push(`Frequency: ${this.frequencyLabel(filters.filterFrequency as RecurringFrequency)}`);
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
    const dialogRef = this.dialog.open(BillDialogComponent, {
      width: '440px',
      data: { accounts: this.accounts, categories: this.categories, initialType: type } as BillDialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.billsService.create(result).subscribe({
        next: () => {
          this.snackBar.open('Bill created', 'Dismiss', { duration: 3000 });
          this.loadBills();
        },
        error: err => {
          this.snackBar.open(err.error?.message || 'Failed to create bill', 'Dismiss', { duration: 3000 });
        },
      });
    });
  }

  openEditDialog(bill: Bill) {
    const dialogRef = this.dialog.open(BillDialogComponent, {
      width: '440px',
      data: { bill, accounts: this.accounts, categories: this.categories } as BillDialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.billsService.update(bill.id, result).subscribe({
        next: () => {
          this.snackBar.open('Bill updated', 'Dismiss', { duration: 3000 });
          this.loadBills();
        },
        error: err => {
          this.snackBar.open(err.error?.message || 'Failed to update bill', 'Dismiss', { duration: 3000 });
        },
      });
    });
  }

  confirmDelete(bill: Bill) {
    const label = bill.description || bill.category?.name || 'this bill';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Bill',
        message: `Are you sure you want to delete "${label}"? This will not delete any transactions already generated from it.`,
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.billsService.delete(bill.id).subscribe({
        next: () => {
          this.snackBar.open('Bill deleted', 'Dismiss', { duration: 3000 });
          this.loadBills();
        },
        error: err => {
          this.snackBar.open(err.error?.message || 'Failed to delete bill', 'Dismiss', { duration: 3000 });
        },
      });
    });
  }

  payBill(bill: Bill) {
    if (this.payingIds.has(bill.id)) return;

    this.payingIds.add(bill.id);
    const label = bill.description || bill.category?.name || 'this bill';
    const direction = bill.type === 'EXPENSE' ? 'debited from' : 'credited to';
    const actionLabel = bill.type === 'EXPENSE' ? 'Pay' : 'Receive';
    const successMessage = bill.type === 'EXPENSE' ? 'Bill paid - transaction recorded' : 'Income received - transaction recorded';
    const failureMessage = bill.type === 'EXPENSE' ? 'Failed to pay bill' : 'Failed to receive income';
    const amount = Number(bill.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: actionLabel,
        message: `${actionLabel} for "${label}" worth ₱${amount}? This amount will be ${direction} ${bill.account.name}.`,
        confirmText: actionLabel,
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        this.payingIds.delete(bill.id);
        return;
      }
      this.billsService.generate(bill.id).subscribe({
        next: () => {
          this.payingIds.delete(bill.id);
          this.snackBar.open(successMessage, 'Dismiss', { duration: 3000 });
          this.loadBills();
        },
        error: err => {
          this.payingIds.delete(bill.id);
          this.snackBar.open(err.error?.message || failureMessage, 'Dismiss', { duration: 3000 });
        },
      });
    });
  }

  isPaying(id: string): boolean {
    return this.payingIds.has(id);
  }

  frequencyLabel(freq: RecurringFrequency): string {
    return {
      ONCE: 'One-time',
      WEEKLY: 'Weekly',
      MONTHLY: 'Monthly',
      YEARLY: 'Yearly',
    }[freq];
  }

  statusColor(status: BillStatus): '' | 'primary' | 'accent' {
    const colors = {
      ACTIVE: 'primary',
      COMPLETED: 'accent',
      CANCELLED: '',
    } as const;
    return colors[status];
  }

  private sortBills(bills: Bill[]): Bill[] {
    const { active, direction } = this.sortState;

    if (!active || !direction) {
      return [...bills];
    }

    const multiplier = direction === 'asc' ? 1 : -1;

    return [...bills].sort((left, right) => {
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

  private getSortableValue(bill: Bill, column: string): number | string {
    switch (column) {
      case 'description':
        return (bill.description || bill.category.name).toLowerCase();
      case 'amount':
        return Number(bill.amount);
      case 'frequency':
        return this.frequencyLabel(bill.frequency).toLowerCase();
      case 'status':
        return bill.status.toLowerCase();
      case 'account':
        return bill.account.name.toLowerCase();
      case 'category':
        return bill.category.name.toLowerCase();
      case 'nextDueDate':
        return new Date(bill.nextDueDate).getTime();
      default:
        return '';
    }
  }

  private filterBills(type: 'EXPENSE' | 'INCOME'): Bill[] {
    const filters = this.getFilters(type);
    const query = filters.searchQuery.trim().toLowerCase();

    const filteredBills = this.bills.filter(bill => {
      if (bill.type !== type) return false;
      if (filters.filterAccountId && bill.accountId !== filters.filterAccountId) return false;
      if (filters.filterCategoryId && bill.categoryId !== filters.filterCategoryId) return false;
      if (filters.filterFrequency && bill.frequency !== filters.filterFrequency) return false;
      if (filters.filterStatus && bill.status !== filters.filterStatus) return false;

      const dueDate = new Date(bill.nextDueDate);
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

      return [bill.description || '', bill.account.name, bill.category.name].some(value => value.toLowerCase().includes(query));
    });

    return this.sortBills(filteredBills);
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
