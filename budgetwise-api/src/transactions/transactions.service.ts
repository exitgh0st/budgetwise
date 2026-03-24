import { Injectable, NotFoundException } from '@nestjs/common';
import { Transaction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTransactionDto): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: dto.accountId } });
      if (!account) throw new NotFoundException(`Account ${dto.accountId} not found`);

      const category = await tx.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException(`Category ${dto.categoryId} not found`);

      const transaction = await tx.transaction.create({
        data: {
          type: dto.type,
          amount: dto.amount,
          description: dto.description,
          date: dto.date ? new Date(dto.date) : new Date(),
          accountId: dto.accountId,
          categoryId: dto.categoryId,
        },
        include: { account: true, category: true },
      });

      // INCOME adds to balance, EXPENSE subtracts
      const balanceChange = dto.type === 'EXPENSE' ? -dto.amount : dto.amount;
      await tx.account.update({
        where: { id: dto.accountId },
        data: { balance: { increment: balanceChange } },
      });

      return transaction;
    });
  }

  async findAll(filters: FilterTransactionsDto) {
    const where: any = {};

    if (filters.accountId) where.accountId = filters.accountId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.type) where.type = filters.type;
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { account: true, category: true },
        orderBy: { date: 'desc' },
        take: filters.limit,
        skip: filters.offset,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, total, limit: filters.limit, offset: filters.offset };
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { account: true, category: true },
    });
    if (!transaction) throw new NotFoundException(`Transaction ${id} not found`);
    return transaction;
  }

  async update(id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException(`Transaction ${id} not found`);

      // Step 1: Reverse old transaction's effect on the OLD account
      const oldBalanceReverse = existing.type === 'EXPENSE'
        ? Number(existing.amount)   // add back the expense
        : -Number(existing.amount); // remove the income
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: oldBalanceReverse } },
      });

      // Step 2: Apply the update
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          type: dto.type ?? existing.type,
          amount: dto.amount ?? existing.amount,
          description: dto.description ?? existing.description,
          date: dto.date ? new Date(dto.date) : existing.date,
          accountId: dto.accountId ?? existing.accountId,
          categoryId: dto.categoryId ?? existing.categoryId,
        },
        include: { account: true, category: true },
      });

      // Step 3: Apply new transaction's effect on the NEW account
      const newType = dto.type ?? existing.type;
      const newAmount = dto.amount ?? Number(existing.amount);
      const newAccountId = dto.accountId ?? existing.accountId;
      const newBalanceChange = newType === 'EXPENSE' ? -newAmount : newAmount;
      await tx.account.update({
        where: { id: newAccountId },
        data: { balance: { increment: newBalanceChange } },
      });

      return updated;
    });
  }

  async remove(id: string): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({ where: { id } });
      if (!transaction) throw new NotFoundException(`Transaction ${id} not found`);

      // Reverse the balance effect
      const balanceReverse = transaction.type === 'EXPENSE'
        ? Number(transaction.amount)
        : -Number(transaction.amount);
      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: balanceReverse } },
      });

      return tx.transaction.delete({ where: { id } });
    });
  }
}
