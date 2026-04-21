import { Injectable } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getUtcMonthRange } from '../common/date.util';
import { ReportCacheService } from './report-cache.service';
import {
  SummaryReport,
  CategoryBreakdown,
  BudgetStatus,
  MonthlyTrend,
} from './types/report.types';

/**
 * Computes aggregated financial reports (summary, spending breakdown, budget status, monthly trend).
 * All public methods are cache-aware: results are stored via `ReportCacheService` and
 * invalidated whenever a user's transactions or budgets change.
 */
@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private reportCache: ReportCacheService,
  ) {}

  private getResolvedMonthYear(month?: number, year?: number) {
    const now = new Date();

    return {
      month: month ?? now.getMonth() + 1,
      year: year ?? now.getFullYear(),
    };
  }

  private getRelativeMonthParts(monthOffset = 0) {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);

    return {
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };
  }

  private getBudgetKey(
    categoryId: string,
    month: number,
    year: number,
  ): string {
    return `${categoryId}:${year}-${month}`;
  }

  /** Returns IDs of system categories so they can be excluded from user-facing reports. */
  private async getSystemCategoryIds(): Promise<string[]> {
    const cats = await this.prisma.category.findMany({
      where: { isSystem: true },
      select: { id: true },
      take: 50,
    });
    return cats.map((c) => c.id);
  }

  /** Returns total income, total expenses, and net balance for the given month/year. */
  async getSummary(
    month?: number,
    year?: number,
    userId?: string,
  ): Promise<SummaryReport> {
    if (!userId) {
      return this.computeSummary(month, year);
    }

    return this.reportCache.remember(
      userId,
      'summary',
      [month ?? 'current', year ?? 'current'],
      () => this.computeSummary(month, year, userId),
    );
  }

  private async computeSummary(
    month?: number,
    year?: number,
    userId?: string,
  ): Promise<SummaryReport> {
    const { month: m, year: y } = this.getResolvedMonthYear(month, year);
    const { startDate, endDate } = getUtcMonthRange(m, y);

    const systemCategoryIds = await this.getSystemCategoryIds();
    const where: Prisma.TransactionWhereInput = {
      date: { gte: startDate, lte: endDate },
      type: { in: [TransactionType.INCOME, TransactionType.EXPENSE] },
    };
    if (userId) where.userId = userId;
    if (systemCategoryIds.length > 0) {
      where.categoryId = { notIn: systemCategoryIds };
    }

    const result = await this.prisma.transaction.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true },
    });

    const income = Number(
      result.find((r) => r.type === 'INCOME')?._sum.amount ?? 0,
    );
    const expenses = Number(
      result.find((r) => r.type === 'EXPENSE')?._sum.amount ?? 0,
    );

    return {
      month: m,
      year: y,
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses,
    };
  }

  /** Returns expense totals grouped by category, sorted descending by amount spent. */
  async getSpendingByCategory(
    month?: number,
    year?: number,
    userId?: string,
  ): Promise<CategoryBreakdown[]> {
    if (!userId) {
      return this.computeSpendingByCategory(month, year);
    }

    return this.reportCache.remember(
      userId,
      'spending-by-category',
      [month ?? 'current', year ?? 'current'],
      () => this.computeSpendingByCategory(month, year, userId),
    );
  }

  private async computeSpendingByCategory(
    month?: number,
    year?: number,
    userId?: string,
  ): Promise<CategoryBreakdown[]> {
    const { month: m, year: y } = this.getResolvedMonthYear(month, year);
    const { startDate, endDate } = getUtcMonthRange(m, y);

    const systemCategoryIds = await this.getSystemCategoryIds();
    const where: Prisma.TransactionWhereInput = {
      type: TransactionType.EXPENSE,
      date: { gte: startDate, lte: endDate },
    };
    if (userId) where.userId = userId;
    if (systemCategoryIds.length > 0) {
      where.categoryId = { notIn: systemCategoryIds };
    }

    const results = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    const groupedResults = results.filter(
      (
        result,
      ): result is typeof result & {
        categoryId: string;
      } => result.categoryId !== null,
    );

    const categoryIds = groupedResults.map((r) => r.categoryId);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: {
        id: true,
        name: true,
        icon: true,
      },
      take: categoryIds.length || 1,
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const totalSpending = groupedResults.reduce(
      (sum, r) => sum + Number(r._sum.amount ?? 0),
      0,
    );

    return groupedResults
      .map((r) => {
        const cat = categoryMap.get(r.categoryId);
        const spent = Number(r._sum.amount ?? 0);
        return {
          categoryId: r.categoryId,
          categoryName: cat?.name ?? 'Unknown',
          categoryIcon: cat?.icon ?? null,
          totalSpent: spent,
          percentage:
            totalSpending > 0 ? Math.round((spent / totalSpending) * 100) : 0,
          transactionCount: r._count,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }

  /**
   * Returns each budget for the period along with how much was spent and how much is remaining.
   * Accounts for spillover: unspent budget from prior months is carried forward and added to
   * the current period's effective budget.
   */
  async getBudgetStatus(
    month?: number,
    year?: number,
    userId?: string,
  ): Promise<BudgetStatus[]> {
    if (!userId) {
      return this.computeBudgetStatus(month, year);
    }

    return this.reportCache.remember(
      userId,
      'budget-status',
      [month ?? 'current', year ?? 'current'],
      () => this.computeBudgetStatus(month, year, userId),
    );
  }

  private async computeBudgetStatus(
    month?: number,
    year?: number,
    userId?: string,
  ): Promise<BudgetStatus[]> {
    const { month: m, year: y } = this.getResolvedMonthYear(month, year);
    const { startDate, endDate } = getUtcMonthRange(m, y);

    const budgetWhere: Prisma.BudgetWhereInput = { month: m, year: y };
    if (userId) budgetWhere.userId = userId;

    const budgets = await this.prisma.budget.findMany({
      where: budgetWhere,
      orderBy: { category: { name: 'asc' } },
      select: {
        id: true,
        categoryId: true,
        month: true,
        year: true,
        amount: true,
        spillover: true,
        category: {
          select: {
            name: true,
            icon: true,
          },
        },
      },
      take: 250,
    });
    const budgetCache = new Map<
      string,
      {
        amount: number;
        spillover: boolean;
      }
    >(
      budgets.map((budget) => [
        this.getBudgetKey(budget.categoryId, budget.month, budget.year),
        {
          amount: Number(budget.amount),
          spillover: budget.spillover,
        },
      ]),
    );

    const systemCategoryIds = await this.getSystemCategoryIds();
    const txWhere: Prisma.TransactionWhereInput = {
      type: TransactionType.EXPENSE,
      date: { gte: startDate, lte: endDate },
    };
    if (userId) txWhere.userId = userId;
    if (systemCategoryIds.length > 0) {
      txWhere.categoryId = { notIn: systemCategoryIds };
    }

    const spending = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: txWhere,
      _sum: { amount: true },
    });
    const spendingMap = new Map(
      spending.map((s) => [s.categoryId, Number(s._sum.amount ?? 0)]),
    );
    const spentCache = new Map<string, number>(
      budgets.map((budget) => [
        this.getBudgetKey(budget.categoryId, budget.month, budget.year),
        spendingMap.get(budget.categoryId) ?? 0,
      ]),
    );
    // carryCache stores Promises so concurrent calls for the same key coalesce onto one DB read.
    const carryCache = new Map<string, Promise<number>>();

    // Lazily fetches actual spending for a given category/month, caching results in spentCache.
    const getSpentFor = async (
      categoryId: string,
      targetMonth: number,
      targetYear: number,
    ): Promise<number> => {
      const key = this.getBudgetKey(categoryId, targetMonth, targetYear);
      const cached = spentCache.get(key);
      if (cached !== undefined) {
        return cached;
      }

      const { startDate: monthStart, endDate: monthEnd } = getUtcMonthRange(
        targetMonth,
        targetYear,
      );
      if (systemCategoryIds.includes(categoryId)) {
        spentCache.set(key, 0);
        return 0;
      }

      const where: Prisma.TransactionWhereInput = {
        type: TransactionType.EXPENSE,
        categoryId,
        date: { gte: monthStart, lte: monthEnd },
      };

      if (userId) {
        where.userId = userId;
      }

      const aggregate = await this.prisma.transaction.aggregate({
        where,
        _sum: { amount: true },
      });
      const spentAmount = Number(aggregate._sum.amount ?? 0);
      spentCache.set(key, spentAmount);
      return spentAmount;
    };

    // Lazily fetches a budget record for a given category/month, caching results in budgetCache.
    const findBudgetFor = async (
      categoryId: string,
      targetMonth: number,
      targetYear: number,
    ): Promise<{ amount: number; spillover: boolean } | null> => {
      const key = this.getBudgetKey(categoryId, targetMonth, targetYear);
      const cached = budgetCache.get(key);
      if (cached) {
        return cached;
      }

      const where: Prisma.BudgetWhereInput = {
        categoryId,
        month: targetMonth,
        year: targetYear,
      };
      if (userId) {
        where.userId = userId;
      }

      const budget = await this.prisma.budget.findFirst({ where });
      if (!budget) {
        return null;
      }

      const normalizedBudget = {
        amount: Number(budget.amount),
        spillover: budget.spillover,
      };
      budgetCache.set(key, normalizedBudget);
      return normalizedBudget;
    };

    /**
     * Recursively computes the budget carry-forward for a category into `targetMonth`.
     * Formula: carry = priorBudget + priorCarry - priorSpent
     * Base cases: no prior budget record, or spillover=false → carry is 0.
     *
     * The Promise is stored in `carryCache` before awaiting so re-entrant calls for
     * the same key (possible when processing multiple budgets concurrently) share the
     * single in-flight DB round-trip rather than issuing duplicates.
     */
    const computeCarry = async (
      categoryId: string,
      targetMonth: number,
      targetYear: number,
    ): Promise<number> => {
      const key = this.getBudgetKey(categoryId, targetMonth, targetYear);
      const cached = carryCache.get(key);
      if (cached) {
        return cached;
      }

      const carryPromise = (async () => {
        const previousMonth = targetMonth === 1 ? 12 : targetMonth - 1;
        const previousYear = targetMonth === 1 ? targetYear - 1 : targetYear;
        const priorBudget = await findBudgetFor(
          categoryId,
          previousMonth,
          previousYear,
        );

        if (!priorBudget || !priorBudget.spillover) {
          return 0;
        }

        const priorSpent = await getSpentFor(
          categoryId,
          previousMonth,
          previousYear,
        );
        const priorCarry = await computeCarry(
          categoryId,
          previousMonth,
          previousYear,
        );

        return priorBudget.amount + priorCarry - priorSpent;
      })();

      carryCache.set(key, carryPromise);
      return carryPromise;
    };

    return Promise.all(
      budgets.map(async (budget) => {
        const spent = spendingMap.get(budget.categoryId) ?? 0;
        const baseBudget = Number(budget.amount);
        const carriedAmount = await computeCarry(
          budget.categoryId,
          budget.month,
          budget.year,
        );
        const effectiveBudget = baseBudget + carriedAmount;
        const remaining = effectiveBudget - spent;

        return {
          budgetId: budget.id,
          categoryId: budget.categoryId,
          categoryName: budget.category.name,
          categoryIcon: budget.category.icon,
          budgetAmount: baseBudget,
          baseBudget,
          carriedAmount,
          effectiveBudget,
          spent,
          remaining,
          percentUsed:
            effectiveBudget > 0
              ? Math.round((spent / effectiveBudget) * 100)
              : 0,
          isOver: spent > effectiveBudget,
          spillover: budget.spillover,
        };
      }),
    );
  }

  /** Returns income and expense totals for the last `months` calendar months (default: 6), oldest first. */
  async getMonthlyTrend(
    months?: number,
    userId?: string,
  ): Promise<MonthlyTrend[]> {
    if (!userId) {
      return this.computeMonthlyTrend(months);
    }

    return this.reportCache.remember(
      userId,
      'monthly-trend',
      [months ?? 6],
      () => this.computeMonthlyTrend(months, userId),
    );
  }

  private async computeMonthlyTrend(
    months?: number,
    userId?: string,
  ): Promise<MonthlyTrend[]> {
    const n = months ?? 6;
    const results: MonthlyTrend[] = [];

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const systemCategoryIds = await this.getSystemCategoryIds();

    for (let i = n - 1; i >= 0; i--) {
      const { month: m, year: y } = this.getRelativeMonthParts(-i);
      const { startDate, endDate } = getUtcMonthRange(m, y);

      const where: Prisma.TransactionWhereInput = {
        date: { gte: startDate, lte: endDate },
        type: { in: [TransactionType.INCOME, TransactionType.EXPENSE] },
      };
      if (userId) where.userId = userId;
      if (systemCategoryIds.length > 0) {
        where.categoryId = { notIn: systemCategoryIds };
      }

      const grouped = await this.prisma.transaction.groupBy({
        by: ['type'],
        where,
        _sum: { amount: true },
      });

      const income = Number(
        grouped.find((g) => g.type === 'INCOME')?._sum.amount ?? 0,
      );
      const expenses = Number(
        grouped.find((g) => g.type === 'EXPENSE')?._sum.amount ?? 0,
      );

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
