import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
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

  bills: Bill[] = [];
  filteredBills: Bill[] = [];
  expenseBills: Bill[] = [];
  incomeBills: Bill[] = [];
  loading = false;
  isMobile = false;
  payingIds = new Set<string>();
  searchQuery = '';
  activeTabIndex = 0;

  filterAccountId = '';
  filterCategoryId = '';
  filterFrequency = '';
  filterStatus = '';
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;

  accounts: Account[] = [];
  categories: Category[] = [];

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

  get hasActiveFilters(): boolean {
    return !!(
      this.filterAccountId ||
      this.filterCategoryId ||
      this.filterFrequency ||
      this.filterStatus ||
      this.filterStartDate ||
      this.filterEndDate ||
      this.searchQuery
    );
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
    const query = this.searchQuery.trim().toLowerCase();
    this.filteredBills = this.bills.filter(bill => {
      if (this.filterAccountId && bill.accountId !== this.filterAccountId) return false;
      if (this.filterCategoryId && bill.categoryId !== this.filterCategoryId) return false;
      if (this.filterFrequency && bill.frequency !== this.filterFrequency) return false;
      if (this.filterStatus && bill.status !== this.filterStatus) return false;

      const dueDate = new Date(bill.nextDueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (this.filterStartDate) {
        const start = new Date(this.filterStartDate);
        start.setHours(0, 0, 0, 0);
        if (dueDate < start) return false;
      }

      if (this.filterEndDate) {
        const end = new Date(this.filterEndDate);
        end.setHours(0, 0, 0, 0);
        if (dueDate > end) return false;
      }

      if (!query) return true;

      return [bill.description || '', bill.account.name, bill.category.name]
        .some(value => value.toLowerCase().includes(query));
    });
    this.expenseBills = this.filteredBills.filter(bill => bill.type === 'EXPENSE');
    this.incomeBills = this.filteredBills.filter(bill => bill.type === 'INCOME');
  }

  onFilterChange() {
    this.applyFilters();
  }

  onTabChange(index: number) {
    this.activeTabIndex = index;
  }

  clearFilters() {
    this.filterAccountId = '';
    this.filterCategoryId = '';
    this.filterFrequency = '';
    this.filterStatus = '';
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.searchQuery = '';
    this.applyFilters();
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
    const amount = Number(bill.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Pay Bill',
        message: `Pay ₱${amount} for "${label}"? This amount will be ${direction} ${bill.account.name}.`,
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
          this.snackBar.open('Bill paid — transaction recorded', 'Dismiss', { duration: 3000 });
          this.loadBills();
        },
        error: err => {
          this.payingIds.delete(bill.id);
          this.snackBar.open(err.error?.message || 'Failed to pay bill', 'Dismiss', { duration: 3000 });
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
}
