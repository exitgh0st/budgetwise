import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, PercentPipe } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { forkJoin } from 'rxjs';
import { ReportsService } from '../../core/services/reports.service';
import { BudgetsService } from '../../core/services/budgets.service';
import { CategoriesService } from '../../core/services/categories.service';
import { BudgetStatus } from '../../core/models/report.model';
import { Category } from '../../core/models/category.model';
import { BudgetDialogComponent, BudgetDialogData } from './budget-dialog/budget-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [
    CurrencyPipe,
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
export class BudgetsComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private budgetsService = inject(BudgetsService);
  private categoriesService = inject(CategoriesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private breakpointObserver = inject(BreakpointObserver);

  budgetStatuses: BudgetStatus[] = [];
  allCategories: Category[] = [];
  unbudgetedCategories: Category[] = [];
  loading = true;
  isMobile = false;

  currentMonth: number;
  currentYear: number;

  constructor() {
    const now = new Date();
    this.currentMonth = now.getMonth() + 1;
    this.currentYear = now.getFullYear();
  }

  get monthLabel(): string {
    const date = new Date(this.currentYear, this.currentMonth - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });
    this.loadData();
  }

  loadData() {
    this.loading = true;
    forkJoin({
      statuses: this.reportsService.getBudgetStatus(this.currentMonth, this.currentYear),
      categories: this.categoriesService.getAll(),
    }).subscribe({
      next: ({ statuses, categories }) => {
        this.budgetStatuses = statuses;
        this.allCategories = categories.filter(c => !c.isSystem);
        const budgetedIds = new Set(statuses.map(s => s.categoryId));
        this.unbudgetedCategories = categories.filter(c => !budgetedIds.has(c.id));
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load budgets', 'Dismiss', { duration: 3000 });
        this.loading = false;
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

  getProgressColor(percentUsed: number): string {
    if (percentUsed > 90) return 'red';
    if (percentUsed >= 70) return 'amber';
    return 'green';
  }

  getProgressValue(percentUsed: number): number {
    return Math.min(percentUsed, 100);
  }

  openSetBudgetDialog(preselectedCategoryId?: string) {
    const dialogRef = this.dialog.open(BudgetDialogComponent, {
      width: '400px',
      data: {
        categories: this.unbudgetedCategories,
        categoryId: preselectedCategoryId || '',
        isEdit: false,
        monthLabel: this.monthLabel,
      } as BudgetDialogData,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.budgetsService.create({
          categoryId: result.categoryId,
          amount: result.amount,
          month: this.currentMonth,
          year: this.currentYear,
        }).subscribe({
          next: () => {
            this.snackBar.open('Budget created', 'Dismiss', { duration: 3000 });
            this.loadData();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to create budget', 'Dismiss', { duration: 3000 });
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
        amount: Number(status.budgetAmount),
        isEdit: true,
        monthLabel: this.monthLabel,
      } as BudgetDialogData,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.budgetsService.update(status.budgetId, { amount: result.amount }).subscribe({
          next: () => {
            this.snackBar.open('Budget updated', 'Dismiss', { duration: 3000 });
            this.loadData();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to update budget', 'Dismiss', { duration: 3000 });
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
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.budgetsService.delete(status.budgetId).subscribe({
          next: () => {
            this.snackBar.open('Budget deleted', 'Dismiss', { duration: 3000 });
            this.loadData();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to delete budget', 'Dismiss', { duration: 3000 });
          },
        });
      }
    });
  }
}
