import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SummaryReport,
  CategoryBreakdown,
  BudgetStatus,
  MonthlyTrend,
} from './types/report.types';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private getBudgetKey(
    categoryId: string,
    month: number,
    year: number,
  ): string {
    return `${categoryId}:${year}-${month}`;
  }

  private async getSystemCategoryIds(): Promise<string[]> {
    const cats = await this.prisma.category.findMany({
      where: { isSystem: true },
      select: { id: true },
    });
    return cats.map((c) => c.id);
  }

  async getSummary(
    month?: number,
    year?: number,
    userId?: string,
  ): Promise<SummaryReport> {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const systemCategoryIds = await this.getSystemCategoryIds();
    const where: any = {
      date: { gte: startDate, lte: endDate },
      type: { in: ['INCOME', 'EXPENSE'] },
    };
    if (userId) where.userId = userId;
    if (systemCategoryIds.length > 0)
      where.categoryId = { notIn: systemCategoryIds };

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

  async getSpendingByCategory(
    month?: number,
    year?: number,
    userId?: string,
  ): Promise<CategoryBreakdown[]> {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const systemCategoryIds = await this.getSystemCategoryIds();
    const where: any = {
      type: 'EXPENSE',
      date: { gte: startDate, lte: endDate },
    };
    if (userId) where.userId = userId;
    if (systemCategoryIds.length > 0)
      where.categoryId = { notIn: systemCategoryIds };

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

  async getBudgetStatus(
    month?: number,
    year?: number,
    userId?: string,
  ): Promise<BudgetStatus[]> {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const budgetWhere: any = { month: m, year: y };
    if (userId) budgetWhere.userId = userId;

    const budgets = await this.prisma.budget.findMany({
      where: budgetWhere,
      include: { category: true },
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
    const txWhere: any = {
      type: 'EXPENSE',
      date: { gte: startDate, lte: endDate },
    };
    if (userId) txWhere.userId = userId;
    if (systemCategoryIds.length > 0)
      txWhere.categoryId = { notIn: systemCategoryIds };

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
    const carryCache = new Map<string, Promise<number>>();

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

      const monthStart = new Date(targetYear, targetMonth - 1, 1);
      const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);
      const where: any = {
        type: 'EXPENSE',
        categoryId,
        date: { gte: monthStart, lte: monthEnd },
      };

      if (userId) {
        where.userId = userId;
      }
      if (systemCategoryIds.length > 0) {
        where.categoryId = {
          equals: categoryId,
          notIn: systemCategoryIds,
        };
      }

      const aggregate = await this.prisma.transaction.aggregate({
        where,
        _sum: { amount: true },
      });
      const spentAmount = Number(aggregate._sum.amount ?? 0);
      spentCache.set(key, spentAmount);
      return spentAmount;
    };

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

      const where: any = { categoryId, month: targetMonth, year: targetYear };
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

  async getMonthlyTrend(
    months?: number,
    userId?: string,
  ): Promise<MonthlyTrend[]> {
    const n = months ?? 6;
    const now = new Date();
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
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0, 23, 59, 59);

      const where: any = { date: { gte: startDate, lte: endDate } };
      where.type = { in: ['INCOME', 'EXPENSE'] };
      if (userId) where.userId = userId;
      if (systemCategoryIds.length > 0)
        where.categoryId = { notIn: systemCategoryIds };

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
