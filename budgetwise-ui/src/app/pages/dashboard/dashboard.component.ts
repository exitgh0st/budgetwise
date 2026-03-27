import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { forkJoin } from 'rxjs';
import { AccountsService } from '../../core/services/accounts.service';
import { TransactionsService } from '../../core/services/transactions.service';
import { ReportsService } from '../../core/services/reports.service';
import { Transaction } from '../../core/models/transaction.model';
import { SummaryReport, BudgetStatus } from '../../core/models/report.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private accountsService = inject(AccountsService);
  private transactionsService = inject(TransactionsService);
  private reportsService = inject(ReportsService);

  loading = true;
  totalBalance = 0;
  summary: SummaryReport | null = null;
  budgetStatuses: BudgetStatus[] = [];
  recentTransactions: Transaction[] = [];
  upcomingTransactions: Transaction[] = [];

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
        this.totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
        this.summary = summary;
        this.budgetStatuses = budgets;
        console.log(transactions.data);
        this.recentTransactions = transactions.data.filter((t: Transaction) => t.isSettled);
        this.upcomingTransactions = transactions.data.filter((t: Transaction) => !t.isSettled);

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
