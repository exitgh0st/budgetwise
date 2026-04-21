import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { PercentPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Account } from '../../core/models/account.model';
import { Budget } from '../../core/models/budget.model';
import { Category } from '../../core/models/category.model';
import { BudgetStatus } from '../../core/models/report.model';
import { AccountsService } from '../../core/services/accounts.service';
import { BudgetsService } from '../../core/services/budgets.service';
import { CategoriesService } from '../../core/services/categories.service';
import { ReportsService } from '../../core/services/reports.service';
import { TransactionsService } from '../../core/services/transactions.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  TransactionDialogComponent,
  TransactionDialogData,
} from '../transactions/transaction-dialog/transaction-dialog.component';
import {
  BudgetDialogComponent,
  BudgetDialogData,
} from './budget-dialog/budget-dialog.component';
import {
  CopyBudgetPreviewItem,
  CopyBudgetsDialogComponent,
} from './copy-budgets-dialog/copy-budgets-dialog.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [
    AppCurrencyPipe,
    PercentPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
  ],
  templateUrl: './budgets.component.html',
  styleUrl: './budgets.component.scss',
})
/** Budgets page — per-category budget management with carry-forward status and month navigation. */
export class BudgetsComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private budgetsService = inject(BudgetsService);
  private categoriesService = inject(CategoriesService);
  private accountsService = inject(AccountsService);
  private transactionsService = inject(TransactionsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private breakpointObserver = inject(BreakpointObserver);

  budgetStatuses: BudgetStatus[] = [];
  accounts: Account[] = [];
  allCategories: Category[] = [];
  unbudgetedCategories: Category[] = [];
  loading = true;
  isMobile = false;
  copyPreviewLoading = false;
  copySubmitting = false;

  currentMonth: number;
  currentYear: number;

  constructor() {
    const now = new Date();
    this.currentMonth = now.getMonth() + 1;
    this.currentYear = now.getFullYear();
  }

  get monthLabel(): string {
    return this.getMonthLabel(this.currentMonth, this.currentYear);
  }

  get isCopyBusy(): boolean {
    return this.loading || this.copyPreviewLoading || this.copySubmitting;
  }

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe((result) => {
      this.isMobile = result.matches;
    });
    this.loadAccounts();
    this.loadData();
  }

  loadData() {
    this.loading = true;
    forkJoin({
      statuses: this.reportsService.getBudgetStatus(
        this.currentMonth,
        this.currentYear,
      ),
      categories: this.categoriesService.getAll(),
    }).subscribe({
      next: ({ statuses, categories }) => {
        this.budgetStatuses = statuses;
        this.allCategories = categories.filter((category) => !category.isSystem);
        const budgetedIds = new Set(statuses.map((status) => status.categoryId));
        this.unbudgetedCategories = this.allCategories.filter(
          (category) => !budgetedIds.has(category.id),
        );
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load budgets', 'Dismiss', {
          duration: 3000,
        });
        this.loading = false;
      },
    });
  }

  loadAccounts() {
    this.accountsService.getAll().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
      },
      error: () => {
        this.accounts = [];
      },
    });
  }

  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 1) {
      this.currentMonth = 12;
      this.currentYear--;
    }
    this.loadData();
  }

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 12) {
      this.currentMonth = 1;
      this.currentYear++;
    }
    this.loadData();
  }

  copyFromLastMonth() {
    const sourceMonth = this.currentMonth === 1 ? 12 : this.currentMonth - 1;
    const sourceYear =
      this.currentMonth === 1 ? this.currentYear - 1 : this.currentYear;
    const targetMonth = this.currentMonth;
    const targetYear = this.currentYear;
    const sourceLabel = this.getMonthLabel(sourceMonth, sourceYear);
    const targetLabel = this.getMonthLabel(targetMonth, targetYear);

    this.copyPreviewLoading = true;
    forkJoin({
      sourceBudgets: this.budgetsService.getAll(sourceMonth, sourceYear),
      targetBudgets: this.budgetsService.getAll(targetMonth, targetYear),
    }).subscribe({
      next: ({ sourceBudgets, targetBudgets }) => {
        this.copyPreviewLoading = false;

        if (sourceBudgets.length === 0) {
          this.snackBar.open(`No budgets found in ${sourceLabel}`, 'Dismiss', {
            duration: 3000,
          });
          return;
        }

        const previewItems = this.buildCopyPreviewItems(
          sourceBudgets,
          targetBudgets,
        );
        const dialogRef = this.dialog.open(CopyBudgetsDialogComponent, {
          width: '640px',
          maxWidth: 'calc(100vw - 24px)',
          data: {
            sourceLabel,
            targetLabel,
            items: previewItems,
          },
        });

        dialogRef.afterClosed().subscribe((selectedCategoryIds) => {
          if (selectedCategoryIds?.length) {
            this.performCopyFromLastMonth(
              sourceMonth,
              sourceYear,
              targetMonth,
              targetYear,
              sourceLabel,
              selectedCategoryIds,
            );
          }
        });
      },
      error: () => {
        this.copyPreviewLoading = false;
        this.snackBar.open('Failed to load budgets to preview', 'Dismiss', {
          duration: 3000,
        });
      },
    });
  }

  private performCopyFromLastMonth(
    sourceMonth: number,
    sourceYear: number,
    targetMonth: number,
    targetYear: number,
    sourceLabel: string,
    categoryIds: string[],
  ) {
    this.copySubmitting = true;

    this.budgetsService
      .copyFromMonth({
        sourceMonth,
        sourceYear,
        targetMonth,
        targetYear,
        categoryIds,
      })
      .subscribe({
        next: (result) => {
          this.copySubmitting = false;
          let message: string;

          if (result.sourceTotal === 0) {
            message = `No budgets found in ${sourceLabel}`;
          } else if (result.copied === 0) {
            message = 'All categories already have budgets this month';
          } else {
            message = `Copied ${result.copied} budget(s) from ${sourceLabel}`;
            if (result.skipped > 0) {
              message += ` (${result.skipped} already existed)`;
            }
          }

          this.snackBar.open(message, 'Dismiss', { duration: 3000 });
          this.loadData();
        },
        error: () => {
          this.copySubmitting = false;
          this.snackBar.open('Failed to copy budgets', 'Dismiss', {
            duration: 3000,
          });
        },
      });
  }

  /**
   * Builds the preview list for the copy dialog.
   * `willCopy` / `selected` are false for categories that already have a budget
   * in the target month — shown as greyed-out in the dialog so the user knows they'll be skipped.
   */
  private buildCopyPreviewItems(
    sourceBudgets: Budget[],
    targetBudgets: Budget[],
  ): CopyBudgetPreviewItem[] {
    const targetCategoryIds = new Set(
      targetBudgets.map((budget) => budget.categoryId),
    );

    return [...sourceBudgets]
      .map((budget) => ({
        categoryId: budget.categoryId,
        categoryName: budget.category.name,
        categoryIcon: budget.category.icon,
        amount: budget.amount,
        spillover: budget.spillover,
        willCopy: !targetCategoryIds.has(budget.categoryId),
        selected: !targetCategoryIds.has(budget.categoryId),
      }))
      .sort((left, right) => {
        if (left.willCopy !== right.willCopy) {
          return left.willCopy ? -1 : 1;
        }

        return left.categoryName.localeCompare(right.categoryName);
      });
  }

  private getMonthLabel(month: number, year: number): string {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  getProgressColor(percentUsed: number): string {
    if (percentUsed > 90) {
      return 'red';
    }
    if (percentUsed >= 70) {
      return 'amber';
    }
    return 'green';
  }

  getProgressValue(percentUsed: number): number {
    return Math.min(percentUsed, 100);
  }

  getCarryAmountClass(carriedAmount: number): string {
    if (carriedAmount > 0) {
      return 'carry-positive';
    }
    if (carriedAmount < 0) {
      return 'carry-negative';
    }
    return 'carry-neutral';
  }

  openSetBudgetDialog(preselectedCategoryId?: string) {
    const dialogRef = this.dialog.open(BudgetDialogComponent, {
      width: '400px',
      data: {
        categories: this.unbudgetedCategories,
        categoryId: preselectedCategoryId || '',
        spillover: false,
        isEdit: false,
        monthLabel: this.monthLabel,
      } as BudgetDialogData,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.budgetsService
          .create({
            categoryId: result.categoryId,
            amount: result.amount,
            month: this.currentMonth,
            year: this.currentYear,
            spillover: result.spillover,
          })
          .subscribe({
            next: () => {
              this.snackBar.open('Budget created', 'Dismiss', {
                duration: 3000,
              });
              this.loadData();
            },
            error: (err) => {
              this.snackBar.open(
                err.error?.message || 'Failed to create budget',
                'Dismiss',
                { duration: 3000 },
              );
            },
          });
      }
    });
  }

  openEditDialog(status: BudgetStatus) {
    const dialogRef = this.dialog.open(BudgetDialogComponent, {
      width: '400px',
      data: {
        categories: this.allCategories,
        categoryId: status.categoryId,
        amount: Number(status.baseBudget),
        spillover: status.spillover,
        isEdit: true,
        monthLabel: this.monthLabel,
      } as BudgetDialogData,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.budgetsService
          .update(status.budgetId, {
            amount: result.amount,
            spillover: result.spillover,
          })
          .subscribe({
            next: () => {
              this.snackBar.open('Budget updated', 'Dismiss', {
                duration: 3000,
              });
              this.loadData();
            },
            error: (err) => {
              this.snackBar.open(
                err.error?.message || 'Failed to update budget',
                'Dismiss',
                { duration: 3000 },
              );
            },
          });
      }
    });
  }

  openAddTransactionDialog(status: BudgetStatus) {
    if (this.accounts.length === 0) {
      this.snackBar.open('Add an account before creating a transaction', 'Dismiss', {
        duration: 3000,
      });
      return;
    }

    const dialogRef = this.dialog.open(TransactionDialogComponent, {
      width: '440px',
      data: {
        accounts: this.accounts,
        categories: this.allCategories,
        initialValue: {
          type: 'EXPENSE',
          categoryId: status.categoryId,
        },
        lockType: true,
        lockCategory: true,
      } as TransactionDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.transactionsService.create(result).subscribe({
          next: () => {
            this.snackBar.open('Transaction created', 'Dismiss', {
              duration: 3000,
            });
            this.loadData();
          },
          error: (err) => {
            this.snackBar.open(
              err.error?.message || 'Failed to create transaction',
              'Dismiss',
              { duration: 3000 },
            );
          },
        });
      }
    });
  }

  confirmDelete(status: BudgetStatus) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Budget',
        message: `Are you sure you want to delete the budget for "${status.categoryName}"?`,
      } as ConfirmDialogData,
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.budgetsService.delete(status.budgetId).subscribe({
          next: () => {
            this.snackBar.open('Budget deleted', 'Dismiss', {
              duration: 3000,
            });
            this.loadData();
          },
          error: (err) => {
            this.snackBar.open(
              err.error?.message || 'Failed to delete budget',
              'Dismiss',
              { duration: 3000 },
            );
          },
        });
      }
    });
  }
}
