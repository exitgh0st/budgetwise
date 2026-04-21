import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, effect, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin } from 'rxjs';
import {
  BudgetStatus,
  CategoryBreakdown,
  SummaryReport,
} from '../../core/models/report.model';
import { CurrencyService } from '../../core/services/currency.service';
import { ReportsService } from '../../core/services/reports.service';
import { ThemeService } from '../../core/services/theme.service';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

Chart.register(...registerables);

interface MonthOption {
  month: number;
  year: number;
  label: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    AppCurrencyPipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    BaseChartDirective,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
/**
 * Reports page — monthly spending doughnut chart, budget status table, and 6-month income/expense bar chart.
 * Chart.js theme colors are read from CSS custom properties so they respond to dark/light mode changes;
 * an `effect()` in the constructor re-applies the theme whenever `ThemeService.isDark()` changes.
 */
export class ReportsComponent implements OnInit {
  @ViewChild('doughnutChart') doughnutChart?: BaseChartDirective;

  private reportsService = inject(ReportsService);
  private breakpointObserver = inject(BreakpointObserver);
  private themeService = inject(ThemeService);
  private currencyService = inject(CurrencyService);

  isMobile = false;
  loading = true;
  loadingTrend = true;

  monthOptions: MonthOption[] = [];
  selectedMonth = '';

  summary: SummaryReport | null = null;
  categoryBreakdown: CategoryBreakdown[] = [];
  budgetStatuses: BudgetStatus[] = [];

  doughnutData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
      },
    ],
  };

  doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${this.formatChartCurrency(ctx.parsed)}`,
        },
      },
    },
  };

  barData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { label: 'Income', data: [], backgroundColor: '#4CAF50' },
      { label: 'Expenses', data: [], backgroundColor: '#F44336' },
    ],
  };

  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {},
        grid: {},
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => this.formatChartCurrency(value),
        },
        grid: {},
      },
    },
    plugins: {
      legend: {},
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}: ${this.formatChartCurrency(ctx.parsed.y ?? 0)}`,
        },
      },
    },
  };

  constructor() {
    // Re-theme charts whenever the dark/light mode signal fires.
    // queueMicrotask defers the update to after Angular's current rendering pass.
    effect(() => {
      this.themeService.isDark();
      queueMicrotask(() => this.applyChartTheme());
    });
  }

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe((result) => {
      this.isMobile = result.matches;
      this.applyChartTheme();
    });

    this.buildMonthOptions();
    this.loadMonthData();
    this.loadTrendData();
  }

  get currentMonth(): number {
    return parseInt(this.selectedMonth.split('-')[0], 10);
  }

  get currentYear(): number {
    return parseInt(this.selectedMonth.split('-')[1], 10);
  }

  onMonthChange() {
    this.loadMonthData();
  }

  getBudgetProgressValue(percentUsed: number): number {
    return Math.min(percentUsed, 100);
  }

  getBudgetProgressColor(percentUsed: number): string {
    if (percentUsed > 90) {
      return 'red';
    }
    if (percentUsed >= 70) {
      return 'amber';
    }
    return 'green';
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

  /** Populates the month selector with the current month plus the 11 preceding months. */
  private buildMonthOptions() {
    const now = new Date();

    for (let index = 0; index < 12; index++) {
      const date = new Date(now.getFullYear(), now.getMonth() - index);
      this.monthOptions.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
      });
    }

    this.selectedMonth = `${this.monthOptions[0].month}-${this.monthOptions[0].year}`;
  }

  private loadMonthData() {
    this.loading = true;

    forkJoin({
      summary: this.reportsService.getSummary(this.currentMonth, this.currentYear),
      breakdown: this.reportsService.getSpendingByCategory(
        this.currentMonth,
        this.currentYear,
      ),
      budgets: this.reportsService.getBudgetStatus(this.currentMonth, this.currentYear),
    }).subscribe({
      next: ({ summary, breakdown, budgets }) => {
        this.summary = summary;
        this.categoryBreakdown = breakdown.sort(
          (left, right) => right.totalSpent - left.totalSpent,
        );
        this.budgetStatuses = budgets.sort((left, right) =>
          left.categoryName.localeCompare(right.categoryName),
        );
        this.doughnutData = {
          ...this.doughnutData,
          labels: breakdown.map((item) => item.categoryName),
          datasets: [
            {
              ...this.doughnutData.datasets[0],
              data: breakdown.map((item) => Number(item.totalSpent)),
              backgroundColor: this.buildChartPalette(),
            },
          ],
        };
        this.loading = false;
        this.applyChartTheme();
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private loadTrendData() {
    this.loadingTrend = true;

    this.reportsService.getMonthlyTrend(6).subscribe({
      next: (trends) => {
        this.barData = {
          ...this.barData,
          labels: trends.map((item) => item.label),
          datasets: [
            {
              label: 'Income',
              data: trends.map((item) => Number(item.income)),
              backgroundColor: this.readCssVar('--app-income', '#4CAF50'),
            },
            {
              label: 'Expenses',
              data: trends.map((item) => Number(item.expenses)),
              backgroundColor: this.readCssVar('--app-expense', '#F44336'),
            },
          ],
        };
        this.loadingTrend = false;
        this.applyChartTheme();
      },
      error: () => {
        this.loadingTrend = false;
      },
    });
  }

  /** Rebuilds chart option objects from the current CSS custom properties and triggers a Chart.js update. */
  private applyChartTheme() {
    if (typeof window === 'undefined') {
      return;
    }

    const textColor = this.readCssVar('--mat-sys-on-surface', '#1c1b1f');
    const mutedColor = this.readCssVar('--mat-sys-outline', '#6b7280');
    const gridColor = this.readCssVar('--app-chart-grid', 'rgba(0, 0, 0, 0.12)');
    const tooltipBackground = this.readCssVar(
      '--mat-sys-surface-container-high',
      '#ffffff',
    );

    this.doughnutData = {
      ...this.doughnutData,
      datasets: [
        {
          ...this.doughnutData.datasets[0],
          backgroundColor: this.buildChartPalette(),
        },
      ],
    };

    this.doughnutOptions = {
      ...this.doughnutOptions,
      plugins: {
        ...this.doughnutOptions.plugins,
        legend: {
          position: this.isMobile ? 'bottom' : 'right',
          labels: {
            color: textColor,
          },
        },
        tooltip: {
          ...this.doughnutOptions.plugins?.tooltip,
          backgroundColor: tooltipBackground,
          borderColor: gridColor,
          borderWidth: 1,
          titleColor: textColor,
          bodyColor: textColor,
        },
      },
    };

    this.barData = {
      ...this.barData,
      datasets: [
        {
          label: 'Income',
          data: this.barData.datasets[0]?.data ?? [],
          backgroundColor: this.readCssVar('--app-income', '#4CAF50'),
        },
        {
          label: 'Expenses',
          data: this.barData.datasets[1]?.data ?? [],
          backgroundColor: this.readCssVar('--app-expense', '#F44336'),
        },
      ],
    };

    this.barOptions = {
      ...this.barOptions,
      scales: {
        x: {
          ticks: { color: mutedColor },
          grid: { color: gridColor },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: mutedColor,
            callback: (value) => this.formatChartCurrency(value),
          },
          grid: { color: gridColor },
        },
      },
      plugins: {
        ...this.barOptions.plugins,
        legend: {
          labels: {
            color: textColor,
          },
        },
        tooltip: {
          ...this.barOptions.plugins?.tooltip,
          backgroundColor: tooltipBackground,
          borderColor: gridColor,
          borderWidth: 1,
          titleColor: textColor,
          bodyColor: textColor,
        },
      },
    };

    this.doughnutChart?.update();
  }

  private buildChartPalette(): string[] {
    return [
      this.readCssVar('--mat-sys-primary', '#a66a1a'),
      this.readCssVar('--mat-sys-tertiary', '#8b5e3c'),
      this.readCssVar('--app-income', '#4CAF50'),
      this.readCssVar('--app-expense', '#F44336'),
      this.readCssVar('--app-accent-1', '#d2a45c'),
      this.readCssVar('--app-accent-2', '#a66a1a'),
      this.readCssVar('--app-accent-3', '#8b5e3c'),
      this.readCssVar('--app-accent-4', '#de7d4d'),
      this.readCssVar('--app-accent-5', '#6d8299'),
      this.readCssVar('--app-accent-6', '#a34b42'),
      this.readCssVar('--mat-sys-primary-container', '#f2dfbf'),
    ];
  }

  private readCssVar(name: string, fallback: string): string {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return value || fallback;
  }

  private formatChartCurrency(value: unknown): string {
    return this.currencyService.format(Number(value ?? 0));
  }
}
