import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFabButton } from '@angular/material/button';
import { AccountsService } from '../../core/services/accounts.service';
import { Account, AccountType } from '../../core/models/account.model';
import { AccountDialogComponent, AccountDialogData } from './account-dialog/account-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
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
  loading = true;
  isMobile = false;

  get totalBalance(): number {
    return this.accounts.reduce((sum, a) => sum + Number(a.balance), 0);
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
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load accounts', 'Dismiss', { duration: 3000 });
        this.loading = false;
      },
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
      const propsChanged = updateData.name !== account.name || updateData.type !== account.type;

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

      // Sequential: balance first (rollback-friendly — if this fails, props won't update)
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
