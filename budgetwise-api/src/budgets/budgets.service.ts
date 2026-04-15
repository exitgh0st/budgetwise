import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { USER_LIMITS } from '../common/constants/limits';
import { PrismaService } from '../prisma/prisma.service';
import { ReportCacheService } from '../reports/report-cache.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { CopyBudgetsDto } from './dto/copy-budgets.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

const budgetInclude = {
  category: true,
} satisfies Prisma.BudgetInclude;

type BudgetWithCategory = Prisma.BudgetGetPayload<{
  include: typeof budgetInclude;
}>;

export type BudgetResponse = Omit<BudgetWithCategory, 'amount'> & {
  amount: number;
};

@Injectable()
export class BudgetsService {
  constructor(
    private prisma: PrismaService,
    private reportCache: ReportCacheService,
  ) {}

  async create(dto: CreateBudgetDto, userId: string): Promise<BudgetResponse> {
    const count = await this.prisma.budget.count({ where: { userId } });
    if (count >= USER_LIMITS.budgets) {
      throw new BadRequestException(
        `Budget limit reached (${count}/${USER_LIMITS.budgets}). Delete old budgets to create new ones.`,
      );
    }

    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, OR: [{ userId }, { isSystem: true }] },
    });
    if (!category) {
      throw new NotFoundException(`Category ${dto.categoryId} not found`);
    }

    const now = new Date();
    const month = dto.month ?? now.getMonth() + 1;
    const year = dto.year ?? now.getFullYear();

    const budget = await this.prisma.budget.upsert({
      where: {
        categoryId_month_year_userId: {
          categoryId: dto.categoryId,
          month,
          year,
          userId,
        },
      },
      update: {
        amount: dto.amount,
        ...(dto.spillover !== undefined ? { spillover: dto.spillover } : {}),
      },
      create: {
        categoryId: dto.categoryId,
        amount: dto.amount,
        spillover: dto.spillover ?? false,
        month,
        year,
        userId,
      },
      include: budgetInclude,
    });
    await this.reportCache.invalidateUser(userId);

    return this.toResponse(budget);
  }

  async findAll(
    month?: number,
    year?: number,
    userId?: string,
  ): Promise<BudgetResponse[]> {
    const where: Prisma.BudgetWhereInput = {};
    if (userId) where.userId = userId;
    if (month) where.month = month;
    if (year) where.year = year;

    const budgets = await this.prisma.budget.findMany({
      where,
      include: budgetInclude,
      orderBy: { category: { name: 'asc' } },
      take: 250,
    });

    return budgets.map((budget) => this.toResponse(budget));
  }

  async findOne(id: string, userId: string): Promise<BudgetResponse> {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
      include: budgetInclude,
    });

    if (!budget) {
      throw new NotFoundException(`Budget ${id} not found`);
    }

    return this.toResponse(budget);
  }

  async update(
    id: string,
    dto: UpdateBudgetDto,
    userId: string,
  ): Promise<BudgetResponse> {
    await this.findOne(id, userId);

    const budget = await this.prisma.budget.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.spillover !== undefined ? { spillover: dto.spillover } : {}),
      },
      include: budgetInclude,
    });
    await this.reportCache.invalidateUser(userId);

    return this.toResponse(budget);
  }

  async remove(id: string, userId: string): Promise<BudgetResponse> {
    await this.findOne(id, userId);

    const budget = await this.prisma.budget.delete({
      where: { id },
      include: budgetInclude,
    });
    await this.reportCache.invalidateUser(userId);

    return this.toResponse(budget);
  }

  async copyFromMonth(
    dto: CopyBudgetsDto,
    userId: string,
  ): Promise<{ copied: number; skipped: number; sourceTotal: number }> {
    const result = await this.prisma.$transaction(async (tx) => {
      const selectedCategoryIds = dto.categoryIds?.length
        ? new Set(dto.categoryIds)
        : null;

      const sourceBudgets = await tx.budget.findMany({
        where: {
          month: dto.sourceMonth,
          year: dto.sourceYear,
          userId,
          ...(selectedCategoryIds
            ? {
                categoryId: {
                  in: [...selectedCategoryIds],
                },
              }
            : {}),
        },
      });

      if (sourceBudgets.length === 0) {
        return { copied: 0, skipped: 0, sourceTotal: 0 };
      }

      const result = await tx.budget.createMany({
        data: sourceBudgets.map((budget) => ({
          categoryId: budget.categoryId,
          amount: budget.amount,
          spillover: budget.spillover,
          month: dto.targetMonth,
          year: dto.targetYear,
          userId,
        })),
        skipDuplicates: true,
      });

      return {
        copied: result.count,
        skipped: sourceBudgets.length - result.count,
        sourceTotal: sourceBudgets.length,
      };
    });

    if (result.copied > 0) {
      await this.reportCache.invalidateUser(userId);
    }

    return result;
  }

  private toResponse(budget: BudgetWithCategory): BudgetResponse {
    return {
      ...budget,
      amount: Number(budget.amount),
    };
  }
}
