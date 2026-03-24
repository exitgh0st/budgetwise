import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ChartData, ChartOptions, Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin } from 'rxjs';
import { ReportsService } from '../../core/services/reports.service';
import { SummaryReport, CategoryBreakdown, MonthlyTrend } from '../../core/models/report.model';

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
    CurrencyPipe,
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
export class ReportsComponent implements OnInit {
  @ViewChild('doughnutChart') doughnutChart?: BaseChartDirective;

  private reportsService = inject(ReportsService);
  private breakpointObserver = inject(BreakpointObserver);

  isMobile = false;
  loading = true;
  loadingTrend = true;

  // Month selector
  monthOptions: MonthOption[] = [];
  selectedMonth = '';

  // Summary
  summary: SummaryReport | null = null;

  // Category breakdown
  categoryBreakdown: CategoryBreakdown[] = [];

  // Doughnut chart
  doughnutData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#E91E63', '#00BCD4',
        '#8BC34A', '#FF5722', '#607D8B',
      ],
    }],
  };
  doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ₱${Number(ctx.parsed).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        },
      },
    },
  };

  // Bar chart
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
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => '₱' + Number(value).toLocaleString(),
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ₱${(ctx.parsed.y ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        },
      },
    },
  };

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
      this.doughnutOptions = {
        ...this.doughnutOptions,
        plugins: {
          ...this.doughnutOptions.plugins,
          legend: { position: this.isMobile ? 'bottom' : 'right' },
        },
      };
    });
    this.buildMonthOptions();
    this.loadMonthData();
    this.loadTrendData();
  }

  private buildMonthOptions() {
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i);
      this.monthOptions.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      });
    }
    this.selectedMonth = `${this.monthOptions[0].month}-${this.monthOptions[0].year}`;
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

  private loadMonthData() {
    this.loading = true;
    forkJoin({
      summary: this.reportsService.getSummary(this.currentMonth, this.currentYear),
      breakdown: this.reportsService.getSpendingByCategory(this.currentMonth, this.currentYear),
    }).subscribe({
      next: ({ summary, breakdown }) => {
        this.summary = summary;
        this.categoryBreakdown = breakdown.sort((a, b) => b.totalSpent - a.totalSpent);

        // Update doughnut chart
        this.doughnutData = {
          ...this.doughnutData,
          labels: breakdown.map(b => b.categoryName),
          datasets: [{
            ...this.doughnutData.datasets[0],
            data: breakdown.map(b => Number(b.totalSpent)),
          }],
        };

        this.loading = false;
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
          labels: trends.map(t => t.label),
          datasets: [
            { label: 'Income', data: trends.map(t => Number(t.income)), backgroundColor: '#4CAF50' },
            { label: 'Expenses', data: trends.map(t => Number(t.expenses)), backgroundColor: '#F44336' },
          ],
        };
        this.loadingTrend = false;
      },
      error: () => {
        this.loadingTrend = false;
      },
    });
  }
}
