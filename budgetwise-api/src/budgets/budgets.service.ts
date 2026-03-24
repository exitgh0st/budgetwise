import { Injectable, NotFoundException } from '@nestjs/common';
import { Budget } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBudgetDto): Promise<Budget> {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException(`Category ${dto.categoryId} not found`);

    const now = new Date();
    const month = dto.month ?? now.getMonth() + 1;
    const year = dto.year ?? now.getFullYear();

    return this.prisma.budget.upsert({
      where: {
        categoryId_month_year: {
          categoryId: dto.categoryId,
          month,
          year,
        },
      },
      update: { amount: dto.amount },
      create: {
        categoryId: dto.categoryId,
        amount: dto.amount,
        month,
        year,
      },
      include: { category: true },
    });
  }

  async findAll(month?: number, year?: number) {
    const where: any = {};
    if (month) where.month = month;
    if (year) where.year = year;

    return this.prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: { category: { name: 'asc' } },
    });
  }

  async findOne(id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!budget) throw new NotFoundException(`Budget ${id} not found`);
    return budget;
  }

  async update(id: string, dto: UpdateBudgetDto) {
    await this.findOne(id);
    return this.prisma.budget.update({
      where: { id },
      data: { amount: dto.amount },
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.budget.delete({ where: { id } });
  }
}
