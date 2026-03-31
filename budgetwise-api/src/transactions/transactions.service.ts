import { Injectable, NotFoundException } from '@nestjs/common';
import { Transaction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateTransactionDto, userId: string): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({ where: { id: dto.accountId, userId } });
      if (!account) throw new NotFoundException(`Account ${dto.accountId} not found`);

      const category = await tx.category.findFirst({
        where: { id: dto.categoryId, OR: [{ userId }, { isSystem: true }] },
      });
      if (!category) throw new NotFoundException(`Category ${dto.categoryId} not found`);

      const date = dto.date ? new Date(dto.date) : new Date();
      const isSettled = date <= new Date();

      const transaction = await tx.transaction.create({
        data: {
          type: dto.type,
          amount: dto.amount,
          description: dto.description,
          date,
          isSettled,
          accountId: dto.accountId,
          categoryId: dto.categoryId,
          userId,
        },
        include: { account: true, category: true },
      });

      if (isSettled) {
        const balanceChange = dto.type === 'EXPENSE' ? -dto.amount : dto.amount;
        await tx.account.update({
          where: { id: dto.accountId },
          data: { balance: { increment: balanceChange } },
        });
      }

      return transaction;
    });
  }

  async findAll(filters: FilterTransactionsDto, userId: string) {
    const where: any = { userId };

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

  async findOne(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: { account: true, category: true },
    });
    if (!transaction) throw new NotFoundException(`Transaction ${id} not found`);
    return transaction;
  }

  async update(id: string, dto: UpdateTransactionDto, userId: string): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findFirst({ where: { id, userId } });
      if (!existing) throw new NotFoundException(`Transaction ${id} not found`);

      const newDate = dto.date ? new Date(dto.date) : existing.date;
      const newType = dto.type ?? existing.type;
      const newAmount = dto.amount ?? Number(existing.amount);
      const newAccountId = dto.accountId ?? existing.accountId;
      const newIsSettled = newDate <= new Date();

      // Verify new account ownership if it changed
      if (dto.accountId && dto.accountId !== existing.accountId) {
        const newAccount = await tx.account.findFirst({ where: { id: dto.accountId, userId } });
        if (!newAccount) throw new NotFoundException(`Account ${dto.accountId} not found`);
      }

      // Step 1: Reverse old effect ONLY if the old transaction was already settled
      if (existing.isSettled) {
        const oldBalanceReverse = existing.type === 'EXPENSE'
          ? Number(existing.amount)
          : -Number(existing.amount);

        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: { increment: oldBalanceReverse } },
        });
      }

      // Step 2: Apply the update
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          type: newType,
          amount: newAmount,
          description: dto.description ?? existing.description,
          date: newDate,
          isSettled: newIsSettled,
          accountId: newAccountId,
          categoryId: dto.categoryId ?? existing.categoryId,
        },
        include: { account: true, category: true },
      });

      // Step 3: Apply new effect ONLY if the new date is current or past
      if (newIsSettled) {
        const newBalanceChange = newType === 'EXPENSE' ? -newAmount : newAmount;

        await tx.account.update({
          where: { id: newAccountId },
          data: { balance: { increment: newBalanceChange } },
        });
      }

      return updated;
    });
  }

  async remove(id: string, userId: string): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({ where: { id, userId } });
      if (!transaction) throw new NotFoundException(`Transaction ${id} not found`);

      // Reverse the balance effect ONLY if it was settled
      if (transaction.isSettled) {
        const balanceReverse = transaction.type === 'EXPENSE'
          ? Number(transaction.amount)
          : -Number(transaction.amount);
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: balanceReverse } },
        });
      }

      return tx.transaction.delete({ where: { id } });
    });
  }
}
