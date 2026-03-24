# Ticket 07 — Reports Module (Read-Only Aggregations)

**Phase:** 2 — Core Features  
**Priority:** High  
**Depends on:** Ticket 05 (Transactions), Ticket 06 (Budgets)  
**Blocks:** Ticket 13 (Frontend Reports page), Ticket 09 (Frontend Dashboard)

---

## Objective

Create the Reports module with read-only endpoints that aggregate transaction and budget data into useful summaries. No CRUD — just computed data.

---

## Tasks

### 1. Create Module, Service, Controller

```bash
nest generate module reports
nest generate service reports
nest generate controller reports
```

### 2. Define Response Types

**File: `src/reports/types/report.types.ts`**

```typescript
export interface SummaryReport {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number; // income - expenses
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  totalSpent: number;
  percentage: number; // percentage of total spending
  transactionCount: number;
}

export interface BudgetStatus {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOver: boolean;
}

export interface MonthlyTrend {
  month: number;
  year: number;
  label: string; // "Jan 2026", "Feb 2026", etc.
  income: number;
  expenses: number;
  net: number;
}
```

### 3. Implement Service

```typescript
@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ====================================
  // MONTHLY SUMMARY
  // ====================================
  async getSummary(month?: number, year?: number): Promise<SummaryReport> {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59); // last day of month

    const result = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: {
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    const income = Number(result.find(r => r.type === 'INCOME')?._sum.amount ?? 0);
    const expenses = Number(result.find(r => r.type === 'EXPENSE')?._sum.amount ?? 0);

    return {
      month: m,
      year: y,
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses,
    };
  }

  // ====================================
  // SPENDING BY CATEGORY
  // ====================================
  async getSpendingByCategory(month?: number, year?: number): Promise<CategoryBreakdown[]> {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const results = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        type: 'EXPENSE',
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Fetch category details
    const categoryIds = results.map(r => r.categoryId);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    const totalSpending = results.reduce((sum, r) => sum + Number(r._sum.amount ?? 0), 0);

    return results
      .map(r => {
        const cat = categoryMap.get(r.categoryId);
        const spent = Number(r._sum.amount ?? 0);
        return {
          categoryId: r.categoryId,
          categoryName: cat?.name ?? 'Unknown',
          categoryIcon: cat?.icon ?? null,
          totalSpent: spent,
          percentage: totalSpending > 0 ? Math.round((spent / totalSpending) * 100) : 0,
          transactionCount: r._count,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent); // highest spending first
  }

  // ====================================
  // BUDGET STATUS
  // ====================================
  async getBudgetStatus(month?: number, year?: number): Promise<BudgetStatus[]> {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    // Get all budgets for this month
    const budgets = await this.prisma.budget.findMany({
      where: { month: m, year: y },
      include: { category: true },
    });

    // Get spending per category for this month
    const spending = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        type: 'EXPENSE',
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });
    const spendingMap = new Map(spending.map(s => [s.categoryId, Number(s._sum.amount ?? 0)]));

    return budgets.map(b => {
      const spent = spendingMap.get(b.categoryId) ?? 0;
      const budgetAmount = Number(b.amount);
      const remaining = budgetAmount - spent;
      return {
        budgetId: b.id,
        categoryId: b.categoryId,
        categoryName: b.category.name,
        categoryIcon: b.category.icon,
        budgetAmount,
        spent,
        remaining,
        percentUsed: budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0,
        isOver: spent > budgetAmount,
      };
    });
  }

  // ====================================
  // MONTHLY TREND
  // ====================================
  async getMonthlyTrend(months?: number): Promise<MonthlyTrend[]> {
    const n = months ?? 6;
    const now = new Date();
    const results: MonthlyTrend[] = [];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0, 23, 59, 59);

      const grouped = await this.prisma.transaction.groupBy({
        by: ['type'],
        where: { date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      });

      const income = Number(grouped.find(g => g.type === 'INCOME')?._sum.amount ?? 0);
      const expenses = Number(grouped.find(g => g.type === 'EXPENSE')?._sum.amount ?? 0);

      results.push({
        month: m,
        year: y,
        label: `${monthNames[m - 1]} ${y}`,
        income,
        expenses,
        net: income - expenses,
      });
    }

    return results;
  }
}
```

### 4. Implement Controller

```typescript
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('summary')
  getSummary(@Query('month') month?: number, @Query('year') year?: number) {
    return this.reportsService.getSummary(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('spending-by-category')
  getSpendingByCategory(@Query('month') month?: number, @Query('year') year?: number) {
    return this.reportsService.getSpendingByCategory(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('budget-status')
  getBudgetStatus(@Query('month') month?: number, @Query('year') year?: number) {
    return this.reportsService.getBudgetStatus(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('monthly-trend')
  getMonthlyTrend(@Query('months') months?: number) {
    return this.reportsService.getMonthlyTrend(months ? Number(months) : undefined);
  }
}
```

### 5. Register & Export

Export `ReportsService` from the module.

---

## API Endpoints

| Method | Endpoint                           | Query Params              | Returns                      |
|--------|------------------------------------|---------------------------|------------------------------|
| GET    | `/api/reports/summary`             | `month?`, `year?`         | `SummaryReport`              |
| GET    | `/api/reports/spending-by-category`| `month?`, `year?`         | `CategoryBreakdown[]`        |
| GET    | `/api/reports/budget-status`       | `month?`, `year?`         | `BudgetStatus[]`             |
| GET    | `/api/reports/monthly-trend`       | `months?` (default 6)     | `MonthlyTrend[]`             |

All default to current month/year if params are omitted.

---

## Acceptance Criteria

- [ ] `/api/reports/summary` returns correct totals for income, expenses, and net
- [ ] `/api/reports/spending-by-category` returns categories sorted by highest spending, with correct percentages
- [ ] `/api/reports/spending-by-category` only counts EXPENSE transactions (not income)
- [ ] `/api/reports/budget-status` returns each budget with its actual spending and remaining amount
- [ ] `/api/reports/budget-status` correctly flags `isOver: true` when spending exceeds budget
- [ ] `/api/reports/monthly-trend` returns the correct number of months of data
- [ ] All endpoints default to current month/year when params are omitted
- [ ] Empty months return zero values (not errors)
- [ ] `ReportsService` is exported
