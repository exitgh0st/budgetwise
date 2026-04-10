import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
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
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBudgetDto, userId: string): Promise<BudgetResponse> {
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

    return this.toResponse(budget);
  }

  async remove(id: string, userId: string): Promise<BudgetResponse> {
    await this.findOne(id, userId);

    const budget = await this.prisma.budget.delete({
      where: { id },
      include: budgetInclude,
    });

    return this.toResponse(budget);
  }

  private toResponse(budget: BudgetWithCategory): BudgetResponse {
    return {
      ...budget,
      amount: Number(budget.amount),
    };
  }
}
