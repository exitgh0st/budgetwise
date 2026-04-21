import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { forkJoin } from 'rxjs';
import { AccountsService } from '../../core/services/accounts.service';
import { TransactionsService } from '../../core/services/transactions.service';
import { ReportsService } from '../../core/services/reports.service';
import { BUDGETWISE_ONBOARDING_STORAGE_KEY } from '../../core/services/onboarding-ui.service';
import { Transaction } from '../../core/models/transaction.model';
import { SummaryReport, BudgetStatus } from '../../core/models/report.model';
import { OnboardingComponent } from '../../shared/components/onboarding/onboarding.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AppCurrencyPipe,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    OnboardingComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
/** Overview page — fetches accounts, current-month summary, budget status, and 10 recent transactions in parallel. */
export class DashboardComponent implements OnInit {
  private accountsService = inject(AccountsService);
  private transactionsService = inject(TransactionsService);
  private reportsService = inject(ReportsService);

  loading = true;
  totalBalance = 0;
  summary: SummaryReport | null = null;
  budgetStatuses: BudgetStatus[] = [];
  recentTransactions: Transaction[] = [];
  showOnboarding = this.shouldShowOnboarding();

  ngOnInit() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    forkJoin({
      accounts: this.accountsService.getAll(),
      summary: this.reportsService.getSummary(month, year),
      budgets: this.reportsService.getBudgetStatus(month, year),
      transactions: this.transactionsService.getAll({ limit: 10 }),
    }).subscribe({
      next: ({ accounts, summary, budgets, transactions }) => {
        this.totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
        this.summary = summary;
        this.budgetStatuses = budgets;
        this.recentTransactions = transactions.data;

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getProgressColor(percentUsed: number): string {
    if (percentUsed > 90) return 'red';
    if (percentUsed >= 70) return 'amber';
    return 'green';
  }

  getProgressValue(percentUsed: number): number {
    return Math.min(percentUsed, 100);
  }

  formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    // Normalize both sides to midnight so the day diff is always a whole number.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  onOnboardingDismissed() {
    this.showOnboarding = false;
  }

  private shouldShowOnboarding() {
    // Guard against SSR environments where localStorage is not available.
    return typeof localStorage !== 'undefined'
      && !localStorage.getItem(BUDGETWISE_ONBOARDING_STORAGE_KEY);
  }
}
