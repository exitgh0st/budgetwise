import { Injectable, NotFoundException } from '@nestjs/common';
import { Budget } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBudgetDto, userId: string): Promise<Budget> {
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, OR: [{ userId }, { isSystem: true }] },
    });
    if (!category) throw new NotFoundException(`Category ${dto.categoryId} not found`);

    const now = new Date();
    const month = dto.month ?? now.getMonth() + 1;
    const year = dto.year ?? now.getFullYear();

    return this.prisma.budget.upsert({
      where: {
        categoryId_month_year_userId: {
          categoryId: dto.categoryId,
          month,
          year,
          userId,
        },
      },
      update: { amount: dto.amount },
      create: {
        categoryId: dto.categoryId,
        amount: dto.amount,
        month,
        year,
        userId,
      },
      include: { category: true },
    });
  }

  async findAll(month?: number, year?: number, userId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (month) where.month = month;
    if (year) where.year = year;

    return this.prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: { category: { name: 'asc' } },
    });
  }

  async findOne(id: string, userId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!budget) throw new NotFoundException(`Budget ${id} not found`);
    return budget;
  }

  async update(id: string, dto: UpdateBudgetDto, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.budget.update({
      where: { id },
      data: { amount: dto.amount },
      include: { category: true },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.budget.delete({ where: { id } });
  }
}
