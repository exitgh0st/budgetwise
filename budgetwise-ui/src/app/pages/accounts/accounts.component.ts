import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatInputModule } from '@angular/material/input';
import { AccountsService } from '../../core/services/accounts.service';
import { Account, AccountType } from '../../core/models/account.model';
import { AccountDialogComponent, AccountDialogData } from './account-dialog/account-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
  ],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss',
})
export class AccountsComponent implements OnInit {
  private accountsService = inject(AccountsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private breakpointObserver = inject(BreakpointObserver);

  accounts: Account[] = [];
  filteredAccounts: Account[] = [];
  loading = true;
  isMobile = false;

  // Filter state
  filterSearch = '';
  filterType = '';

  get hasActiveFilters(): boolean {
    return this.filterSearch.trim() !== '' || this.filterType !== '';
  }

  // Totals always computed from full accounts list, not filtered
  get totalCreditCardDebt(): number {
    return this.accounts
      .filter(a => a.type === 'CREDIT_CARD')
      .reduce((sum, a) => sum + Number(a.balance), 0);
  }

  get totalLiquidBalance(): number {
    return this.accounts
      .filter(a => a.type === 'CASH' || a.type === 'BANK')
      .reduce((sum, a) => sum + Number(a.balance), 0);
  }

  get totalMaintainingBalance(): number {
    return this.accounts.reduce(
      (sum, a) => sum + (a.maintainingBalance != null ? Number(a.maintainingBalance) : 0),
      0
    );
  }

  get totalUsableLiquidBalance(): number {
    return this.totalLiquidBalance - this.totalMaintainingBalance;
  }

  get hasMaintainingBalances(): boolean {
    return this.accounts.some(a => a.maintainingBalance != null && Number(a.maintainingBalance) > 0);
  }

  isBelowMaintaining(account: Account): boolean {
    return (
      account.maintainingBalance != null &&
      Number(account.balance) < Number(account.maintainingBalance)
    );
  }

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });
    this.loadAccounts();
  }

  loadAccounts() {
    this.loading = true;
    this.accountsService.getAll().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load accounts', 'Dismiss', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  onFilterChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.filterSearch = '';
    this.filterType = '';
    this.applyFilters();
  }

  private applyFilters() {
    const search = this.filterSearch.trim().toLowerCase();
    const type = this.filterType;

    this.filteredAccounts = this.accounts.filter(account => {
      const matchesSearch =
        !search || account.name.toLowerCase().includes(search);
      const matchesType =
        !type || account.type === type;
      return matchesSearch && matchesType;
    });
  }

  getTypeIcon(type: AccountType): string {
    switch (type) {
      case 'CASH': return 'payments';
      case 'BANK': return 'account_balance';
      case 'EWALLET': return 'phone_android';
      case 'CREDIT_CARD': return 'credit_card';
      case 'LOAN': return 'account_balance_wallet';
    }
  }

  getTypeLabel(type: AccountType): string {
    switch (type) {
      case 'CASH': return 'Cash';
      case 'BANK': return 'Bank';
      case 'EWALLET': return 'E-Wallet';
      case 'CREDIT_CARD': return 'Credit Card';
      case 'LOAN': return 'Loan';
    }
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(AccountDialogComponent, {
      width: '400px',
      data: {} as AccountDialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.accountsService.create(result).subscribe({
          next: () => {
            this.snackBar.open('Account created', 'Dismiss', { duration: 3000 });
            this.loadAccounts();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to create account', 'Dismiss', { duration: 3000 });
          },
        });
      }
    });
  }

  openEditDialog(account: Account) {
    const dialogRef = this.dialog.open(AccountDialogComponent, {
      width: '400px',
      data: { account } as AccountDialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      const { balance, ...updateData } = result;
      const newBalance = Number(balance);
      const balanceChanged = !isNaN(newBalance) && newBalance !== Number(account.balance);
      const maintainingChanged =
        (result.maintainingBalance ?? null) !== (account.maintainingBalance ?? null) &&
        !(result.maintainingBalance == null && account.maintainingBalance == null);
      const propsChanged =
        updateData.name !== account.name ||
        updateData.type !== account.type ||
        maintainingChanged;

      if (!balanceChanged && !propsChanged) return;

      const onError = (err: any) => {
        this.snackBar.open(err.error?.message || 'Failed to update account', 'Dismiss', { duration: 3000 });
        this.loadAccounts();
      };

      const doPropsUpdate = () => {
        if (!propsChanged) {
          this.snackBar.open('Account updated', 'Dismiss', { duration: 3000 });
          this.loadAccounts();
          return;
        }
        this.accountsService.update(account.id, updateData).subscribe({
          next: () => {
            this.snackBar.open('Account updated', 'Dismiss', { duration: 3000 });
            this.loadAccounts();
          },
          error: onError,
        });
      };

      if (balanceChanged) {
        this.accountsService.adjustBalance(account.id, newBalance).subscribe({
          next: () => doPropsUpdate(),
          error: onError,
        });
      } else {
        doPropsUpdate();
      }
    });
  }

  confirmDelete(account: Account) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Account',
        message: `Are you sure you want to delete "${account.name}"? This will also delete all transactions in this account.`,
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.accountsService.delete(account.id).subscribe({
          next: () => {
            this.snackBar.open('Account deleted', 'Dismiss', { duration: 3000 });
            this.loadAccounts();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to delete account', 'Dismiss', { duration: 3000 });
          },
        });
      }
    });
  }
}