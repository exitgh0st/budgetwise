import { Injectable, NotFoundException } from '@nestjs/common';
import { RecurringTransaction, RecurringFrequency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';

@Injectable()
export class RecurringTransactionsService {
  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
  ) {}

  async create(dto: CreateRecurringTransactionDto, userId: string): Promise<RecurringTransaction> {
    return this.prisma.recurringTransaction.create({
      data: {
        type: dto.type,
        amount: dto.amount,
        description: dto.description,
        frequency: dto.frequency,
        nextDueDate: new Date(dto.nextDueDate),
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        userId,
      },
      include: { account: true, category: true },
    });
  }

  async findAll(userId: string): Promise<RecurringTransaction[]> {
    return this.prisma.recurringTransaction.findMany({
      where: { userId },
      include: { account: true, category: true },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async findOne(id: string, userId: string): Promise<RecurringTransaction> {
    const item = await this.prisma.recurringTransaction.findFirst({
      where: { id, userId },
      include: { account: true, category: true },
    });
    if (!item) throw new NotFoundException(`RecurringTransaction ${id} not found`);
    return item;
  }

  async update(id: string, dto: UpdateRecurringTransactionDto, userId: string): Promise<RecurringTransaction> {
    await this.findOne(id, userId);
    return this.prisma.recurringTransaction.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
        ...(dto.nextDueDate !== undefined && { nextDueDate: new Date(dto.nextDueDate) }),
        ...(dto.accountId !== undefined && { accountId: dto.accountId }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      },
      include: { account: true, category: true },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.prisma.recurringTransaction.delete({ where: { id } });
  }

  /**
   * Creates a real Transaction from this recurring template (with full balance sync via
   * TransactionsService.create), then advances nextDueDate by one frequency period.
   * Uses last-valid-day clamping for MONTHLY/YEARLY (e.g. Jan 31 → Feb 28, not Mar 3).
   */
  async generate(id: string, userId: string): Promise<object> {
    const recurring = await this.findOne(id, userId);

    const transaction = await this.transactionsService.create({
      type: recurring.type,
      amount: Number(recurring.amount),
      description: recurring.description ?? undefined,
      accountId: recurring.accountId,
      categoryId: recurring.categoryId,
      date: recurring.nextDueDate.toISOString(),
    }, userId);

    const next = this.advanceDate(recurring.nextDueDate, recurring.frequency);
    await this.prisma.recurringTransaction.update({
      where: { id },
      data: { nextDueDate: next },
    });

    return transaction;
  }

  private advanceDate(from: Date, frequency: RecurringFrequency): Date {
    const originalDay = from.getDate();
    const month = from.getMonth();
    const year = from.getFullYear();

    switch (frequency) {
      case 'WEEKLY':
        return new Date(year, month, originalDay + 7);

      case 'MONTHLY': {
        // Advance by one calendar month, clamping to last valid day
        const nextMonth = month + 1;
        const nextYear = year + Math.floor(nextMonth / 12);
        const normalizedMonth = nextMonth % 12;
        const lastDay = new Date(nextYear, normalizedMonth + 1, 0).getDate();
        return new Date(nextYear, normalizedMonth, Math.min(originalDay, lastDay));
      }

      case 'YEARLY': {
        // Advance by one year, clamping to last valid day (handles Feb 29 on non-leap years)
        const nextYear = year + 1;
        const lastDay = new Date(nextYear, month + 1, 0).getDate();
        return new Date(nextYear, month, Math.min(originalDay, lastDay));
      }

      default:
        return new Date(from);
    }
  }
}
