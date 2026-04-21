import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { Account } from '../../core/models/account.model';
import { Category } from '../../core/models/category.model';
import { Goal, GoalType } from '../../core/models/goal.model';
import { Transaction } from '../../core/models/transaction.model';
import { AccountsService } from '../../core/services/accounts.service';
import { CategoriesService } from '../../core/services/categories.service';
import { GoalsService } from '../../core/services/goals.service';
import { UserService } from '../../core/services/user.service';
import { TransactionsService } from '../../core/services/transactions.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  GoalContributionDialogComponent,
  GoalContributionDialogData,
} from './goal-contribution-dialog/goal-contribution-dialog.component';
import {
  GoalDialogComponent,
  GoalDialogData,
} from './goal-dialog/goal-dialog.component';
import { GoalTypeDialogComponent } from './goal-type-dialog/goal-type-dialog.component';
import {
  TransactionDialogComponent,
  TransactionDialogData,
} from '../transactions/transaction-dialog/transaction-dialog.component';
import { isAtLimit, isNearLimit, UsageLimits } from '../../core/models/usage-limits.model';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatTooltipModule,
    AppCurrencyPipe,
    DatePipe,
  ],
  templateUrl: './goals.component.html',
  styleUrl: './goals.component.scss',
})
/** Goals page — SAVINGS and DEBT_PAYOFF goals with inline linked-transaction expansion. */
export class GoalsComponent implements OnInit {
  private goalsService = inject(GoalsService);
  private accountsService = inject(AccountsService);
  private categoriesService = inject(CategoriesService);
  private transactionsService = inject(TransactionsService);
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private breakpointObserver = inject(BreakpointObserver);

  goals: Goal[] = [];
  accounts: Account[] = [];
  transactionCategories: Category[] = [];
  expandedGoalIds = new Set<string>();
  loading = false;
  isMobile = false;
  usage: UsageLimits | null = null;
  readonly transactionColumns = ['date', 'type', 'details', 'amount', 'actions'];

  get goalsAtLimit(): boolean {
    return this.usage ? isAtLimit(this.usage.goals) : false;
  }

  get goalsNearLimit(): boolean {
    return this.usage ? isNearLimit(this.usage.goals) : false;
  }

  get addGoalTooltip(): string {
    if (!this.usage) return '';
    const { used, limit } = this.usage.goals;
    if (isAtLimit(this.usage.goals)) {
      return `Goal limit reached (${used}/${limit}). Delete completed goals to create new ones.`;
    }
    if (isNearLimit(this.usage.goals)) {
      return `${used}/${limit} goals used`;
    }
    return '';
  }

  ngOnInit(): void {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe((result) => {
      this.isMobile = result.matches;
    });

    this.loadPage();
    this.loadUsage();
  }

  loadUsage(): void {
    this.userService.getUsage().subscribe({
      next: (data) => { this.usage = data; },
      error: () => {},
    });
  }

  loadPage(): void {
    this.loading = true;

    forkJoin({
      goals: this.goalsService.getAll(),
      accounts: this.accountsService.getAll(),
      categories: this.categoriesService.getAll(),
    }).subscribe({
      next: ({ goals, accounts, categories }) => {
        this.goals = goals;
        this.accounts = accounts;
        this.transactionCategories = categories.filter(
          (category) => !category.isSystem || ['Savings', 'Debt'].includes(category.name),
        );
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(
          err.error?.message || 'Failed to load financial goals',
          'Dismiss',
          { duration: 3000 },
        );
      },
    });
  }

  trackByGoalId(_: number, goal: Goal): string {
    return goal.id;
  }

  percentComplete(goal: Goal): number {
    if (goal.targetAmount <= 0) {
      return 0;
    }

    return (goal.currentAmount / goal.targetAmount) * 100;
  }

  progressBarValue(goal: Goal): number {
    return Math.min(this.percentComplete(goal), 100);
  }

  /** Two-step creation: first pick SAVINGS or DEBT_PAYOFF, then open the goal form. */
  openAddDialog(): void {
    const typeDialogRef = this.dialog.open(GoalTypeDialogComponent, {
      width: '420px',
      autoFocus: 'dialog',
    });

    typeDialogRef.afterClosed().subscribe((goalType: GoalType | undefined) => {
      if (!goalType) {
        return;
      }

      this.openGoalForm(goalType);
    });
  }

  openEditDialog(goal: Goal): void {
    const dialogRef = this.dialog.open(GoalDialogComponent, {
      width: '440px',
      data: {
        goal,
        goalType: goal.type,
        accounts: this.accounts,
      } as GoalDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.goalsService.update(goal.id, result).subscribe({
        next: () => {
          this.snackBar.open('Goal updated', 'Dismiss', { duration: 3000 });
          this.loadPage();
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.message || 'Failed to update goal',
            'Dismiss',
            { duration: 3000 },
          );
        },
      });
    });
  }

  confirmDelete(goal: Goal): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Goal',
        message: `Are you sure you want to delete "${goal.name}"?`,
        confirmText: 'Delete',
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.goalsService.delete(goal.id).subscribe({
        next: () => {
          this.snackBar.open('Goal deleted', 'Dismiss', { duration: 3000 });
          this.loadPage();
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.message || 'Failed to delete goal',
            'Dismiss',
            { duration: 3000 },
          );
        },
      });
    });
  }

  openContributionDialog(goal: Goal): void {
    if (!this.canContribute(goal)) {
      return;
    }

    const dialogRef = this.dialog.open(GoalContributionDialogComponent, {
      width: '440px',
      data: {
        goal,
        accounts: this.accounts,
        categories: this.transactionCategories,
      } as GoalContributionDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.goalsService.contribute(goal.id, result).subscribe({
        next: () => {
          this.snackBar.open('Contribution added', 'Dismiss', {
            duration: 3000,
          });
          this.loadPage();
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.message || 'Failed to add contribution',
            'Dismiss',
            { duration: 3000 },
          );
        },
      });
    });
  }

  /** SAVINGS goals require a linked account (for the transfer); DEBT_PAYOFF goals do not. */
  canContribute(goal: Goal): boolean {
    return goal.type === 'SAVINGS' ? !!goal.accountId : true;
  }

  goalTypeLabel(goal: Goal): string {
    return goal.type === 'SAVINGS' ? 'Savings' : 'Debt Payoff';
  }

  goalIcon(goal: Goal): string {
    return goal.type === 'SAVINGS' ? 'savings' : 'credit_score';
  }

  toggleLinkedTransactions(goalId: string): void {
    if (this.expandedGoalIds.has(goalId)) {
      this.expandedGoalIds.delete(goalId);
      return;
    }

    this.expandedGoalIds.add(goalId);
  }

  isTransactionsExpanded(goalId: string): boolean {
    return this.expandedGoalIds.has(goalId);
  }

  transactionTypeLabel(transaction: Transaction): string {
    switch (transaction.type) {
      case 'TRANSFER':
        return 'Transfer';
      case 'INCOME':
        return 'Income';
      default:
        return 'Expense';
    }
  }

  transactionDetails(transaction: Transaction): string {
    if (transaction.type === 'TRANSFER') {
      return `${transaction.fromAccount?.name || 'Unknown'} → ${transaction.toAccount?.name || 'Unknown'}`;
    }

    return `${transaction.account?.name || 'Unknown'} • ${transaction.category?.name || 'Uncategorized'}`;
  }

  editLinkedTransaction(goal: Goal, transaction: Transaction): void {
    const dialogRef = this.dialog.open(TransactionDialogComponent, {
      width: '440px',
      data: {
        transaction,
        accounts: this.accounts,
        categories: this.transactionCategories,
        lockType: true,
      } as TransactionDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.transactionsService.update(transaction.id, result).subscribe({
        next: () => {
          this.snackBar.open('Linked transaction updated', 'Dismiss', {
            duration: 3000,
          });
          this.loadPage();
          // Re-expand the goal row after reload so the user sees the updated transaction.
          this.expandedGoalIds.add(goal.id);
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.message || 'Failed to update linked transaction',
            'Dismiss',
            { duration: 3000 },
          );
        },
      });
    });
  }

  confirmDeleteLinkedTransaction(goal: Goal, transaction: Transaction): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Linked Transaction',
        message: `Delete "${transaction.description || this.transactionTypeLabel(transaction)}"? This will reduce the goal progress.`,
        confirmText: 'Delete',
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.transactionsService.delete(transaction.id).subscribe({
        next: () => {
          this.snackBar.open('Linked transaction deleted', 'Dismiss', {
            duration: 3000,
          });
          this.loadPage();
          this.expandedGoalIds.add(goal.id);
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.message || 'Failed to delete linked transaction',
            'Dismiss',
            { duration: 3000 },
          );
        },
      });
    });
  }

  private openGoalForm(goalType: GoalType): void {
    const dialogRef = this.dialog.open(GoalDialogComponent, {
      width: '440px',
      data: {
        goalType,
        accounts: this.accounts,
      } as GoalDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.goalsService.create(result).subscribe({
        next: () => {
          this.snackBar.open('Financial goal created', 'Dismiss', {
            duration: 3000,
          });
          this.loadPage();
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.message || 'Failed to create financial goal',
            'Dismiss',
            { duration: 3000 },
          );
        },
      });
    });
  }
}
