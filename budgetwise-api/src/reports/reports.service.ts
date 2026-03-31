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

  async getSummary(month?: number, year?: number, userId?: string): Promise<SummaryReport> {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const where: any = { date: { gte: startDate, lte: endDate } };
    if (userId) where.userId = userId;

    const result = await this.prisma.transaction.groupBy({
      by: ['type'],
      where,
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

  async getSpendingByCategory(month?: number, year?: number, userId?: string): Promise<CategoryBreakdown[]> {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const where: any = {
      type: 'EXPENSE',
      date: { gte: startDate, lte: endDate },
    };
    if (userId) where.userId = userId;

    const results = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      _count: true,
    });

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
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }

  async getBudgetStatus(month?: number, year?: number, userId?: string): Promise<BudgetStatus[]> {
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

    const txWhere: any = {
      type: 'EXPENSE',
      date: { gte: startDate, lte: endDate },
    };
    if (userId) txWhere.userId = userId;

    const spending = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: txWhere,
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

  async getMonthlyTrend(months?: number, userId?: string): Promise<MonthlyTrend[]> {
    const n = months ?? 6;
    const now = new Date();
    const results: MonthlyTrend[] = [];

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0, 23, 59, 59);

      const where: any = { date: { gte: startDate, lte: endDate } };
      if (userId) where.userId = userId;

      const grouped = await this.prisma.transaction.groupBy({
        by: ['type'],
        where,
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
