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

/**
 * Budget vs. actual spending for one category in a given period.
 * `effectiveBudget = baseBudget + carriedAmount` when spillover is enabled;
 * otherwise `carriedAmount` is 0 and `effectiveBudget` equals `baseBudget`.
 */
export interface BudgetStatus {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  budgetAmount: number;
  baseBudget: number;
  /** Unspent budget rolled over from prior months (0 when spillover is disabled). */
  carriedAmount: number;
  /** baseBudget + carriedAmount — the total available budget for this period. */
  effectiveBudget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOver: boolean;
  spillover: boolean;
}

export interface MonthlyTrend {
  month: number;
  year: number;
  label: string;
  income: number;
  expenses: number;
  net: number;
}
