export interface SummaryReport {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  totalSpent: number;
  percentage: number;
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
  label: string;
  income: number;
  expenses: number;
  net: number;
}
