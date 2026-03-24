# Ticket 13 — Reports Page (Charts & Visualizations)

**Phase:** 2 — Frontend  
**Priority:** Medium  
**Depends on:** Ticket 08 (Angular scaffold), Ticket 07 (Reports API)  
**Blocks:** Nothing

---

## Objective

Build the Reports page with visual charts showing spending patterns, income vs expenses over time, and category breakdowns. Uses Chart.js via ng2-charts.

---

## What the Page Shows

```
┌──────────────────────────────────────────────────┐
│  Reports                                         │
│  Month: [March 2026 ▾]                           │
├──────────────────────────┬───────────────────────┤
│                          │                       │
│  SPENDING BY CATEGORY    │  INCOME vs EXPENSES   │
│  (Doughnut/Pie Chart)    │  (Summary Cards)      │
│                          │                       │
│     ┌───────────┐        │  Income:  ₱25,000     │
│     │  🟢 Food  │        │  Expenses: ₱12,400    │
│     │  🔵 Bills │        │  Net:     +₱12,600    │
│     │  🟡 Trans │        │                       │
│     └───────────┘        │                       │
│                          │                       │
├──────────────────────────┴───────────────────────┤
│                                                  │
│  MONTHLY TREND (Bar Chart - last 6 months)       │
│                                                  │
│  ₱30k │   ██                                     │
│  ₱20k │   ██  ██      ██  ██                     │
│  ₱10k │██ ██  ██  ██  ██  ██  ██  ██             │
│       └──Oct──Nov──Dec──Jan──Feb──Mar──          │
│          🟢 Income  🔴 Expenses                   │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Section 1: Month Selector

A `mat-select` dropdown or month picker at the top. Changes the data for the pie chart and summary cards. Default: current month.

### Section 2: Spending by Category (Doughnut Chart)

**Chart type:** Doughnut (from ng2-charts / Chart.js)

**Data source:** `ReportsService.getSpendingByCategory(month, year)`

- Each slice = a category
- Show category name + amount in the legend
- Use distinct colors per category
- Center text (optional): total spending amount

**Below the chart:** A ranked list of categories with amounts and percentages, for accessibility and detail.

### Section 3: Income vs Expenses Summary

Three `mat-card` elements:
- Total Income (green)
- Total Expenses (red)
- Net Balance (green if positive, red if negative)

**Data source:** `ReportsService.getSummary(month, year)`

### Section 4: Monthly Trend (Bar Chart)

**Chart type:** Grouped bar chart (from ng2-charts / Chart.js)

**Data source:** `ReportsService.getMonthlyTrend(6)`

- X-axis: month labels ("Oct 2025", "Nov 2025", etc.)
- Y-axis: amount in PHP
- Two bars per month: green for income, red for expenses
- Optional: line overlay for net balance

This chart does NOT change with the month selector — it always shows the last 6 months.

---

## Chart.js / ng2-charts Setup

```typescript
// In the component
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

// Register required Chart.js components
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
```

### Doughnut Chart Config

```typescript
doughnutData: ChartData<'doughnut'> = {
  labels: [], // category names
  datasets: [{
    data: [],  // spending amounts
    backgroundColor: [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
      '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ],
  }],
};

doughnutOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' }, // 'bottom' on mobile
  },
};
```

### Bar Chart Config

```typescript
barData: ChartData<'bar'> = {
  labels: [], // month labels
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
        label: (ctx) => `${ctx.dataset.label}: ₱${ctx.parsed.y.toLocaleString()}`,
      },
    },
  },
};
```

---

## Responsive Behavior

- **Desktop:** Pie chart and summary cards side by side (2-column). Bar chart full width below.
- **Mobile:** Everything stacks vertically. Pie chart legend moves to bottom. Charts have a minimum height of 250px.
- **Charts must be `responsive: true`** and their containers should use percentage-based widths with minimum heights.

```scss
.chart-container {
  position: relative;
  width: 100%;
  min-height: 300px;

  @media (max-width: 599px) {
    min-height: 250px;
  }
}
```

---

## Implementation Notes

- Load all data on component init. Reload pie chart + summary when month selector changes.
- The monthly trend chart loads once (last 6 months) and doesn't change with the month selector.
- If there's no spending data for a month, show a friendly empty state instead of an empty chart.
- Use `@ViewChild(BaseChartDirective)` to update chart data reactively.

---

## Acceptance Criteria

- [ ] Doughnut chart shows spending breakdown by category with correct proportions
- [ ] Chart colors are distinct and a legend identifies each category
- [ ] Summary cards show correct income, expenses, and net for the selected month
- [ ] Net balance card is green when positive, red when negative
- [ ] Bar chart shows the last 6 months of income vs expenses
- [ ] Bar chart Y-axis labels are formatted as currency (₱)
- [ ] Changing the month selector updates the doughnut chart and summary cards
- [ ] Monthly trend bar chart does NOT change when month selector changes
- [ ] Charts are responsive and resize correctly on window resize
- [ ] On mobile, charts stack vertically and the doughnut legend moves to the bottom
- [ ] Empty state shown when there's no data for a selected month
- [ ] Charts have tooltips showing formatted amounts on hover
