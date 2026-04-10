import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RecurringFrequency, ScheduledTransaction } from '@prisma/client';
import {
  createDateOnlyUtc,
  endOfLocalDay,
  parseDateOnly,
} from '../common/date.util';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateScheduledTransactionDto } from './dto/create-scheduled-transaction.dto';
import { UpdateScheduledTransactionDto } from './dto/update-scheduled-transaction.dto';

@Injectable()
export class ScheduledTransactionsService {
  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
  ) {}

  async create(
    dto: CreateScheduledTransactionDto,
    userId: string,
  ): Promise<ScheduledTransaction> {
    const totalInstallments =
      dto.frequency === 'ONCE' ? 1 : (dto.totalInstallments ?? null);
    const completedInstallments = dto.completedInstallments ?? 0;

    this.validateInstallments(completedInstallments, totalInstallments);
    await this.ensureOwnedAccount(dto.accountId, userId);
    await this.ensureAccessibleCategory(dto.categoryId, userId);

    return this.prisma.scheduledTransaction.create({
      data: {
        type: dto.type,
        amount: dto.amount,
        description: dto.description,
        frequency: dto.frequency,
        nextDueDate: parseDateOnly(dto.nextDueDate),
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        totalInstallments,
        completedInstallments,
        notifyDaysBefore: dto.notifyDaysBefore,
        userId,
      },
      include: { account: true, category: true },
    });
  }

  async findAll(
    userId: string,
    status?: ScheduledTransaction['status'],
  ): Promise<ScheduledTransaction[]> {
    return this.prisma.scheduledTransaction.findMany({
      where: {
        userId,
        ...(status !== undefined && { status }),
      },
      include: { account: true, category: true },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async findOne(id: string, userId: string): Promise<ScheduledTransaction> {
    const scheduledTransaction =
      await this.prisma.scheduledTransaction.findFirst({
        where: { id, userId },
        include: { account: true, category: true },
      });
    if (!scheduledTransaction) {
      throw new NotFoundException(`Scheduled transaction ${id} not found`);
    }
    return scheduledTransaction;
  }

  async update(
    id: string,
    dto: UpdateScheduledTransactionDto,
    userId: string,
  ): Promise<ScheduledTransaction> {
    const existing = await this.findOne(id, userId);
    const nextFrequency = dto.frequency ?? existing.frequency;
    const totalInstallments =
      nextFrequency === 'ONCE'
        ? 1
        : (dto.totalInstallments ?? existing.totalInstallments);
    const completedInstallments =
      dto.completedInstallments ?? existing.completedInstallments;

    this.validateInstallments(completedInstallments, totalInstallments);
    if (dto.accountId !== undefined && dto.accountId !== existing.accountId) {
      await this.ensureOwnedAccount(dto.accountId, userId);
    }

    if (
      dto.categoryId !== undefined &&
      dto.categoryId !== existing.categoryId
    ) {
      await this.ensureAccessibleCategory(dto.categoryId, userId);
    }

    return this.prisma.scheduledTransaction.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
        ...(dto.nextDueDate !== undefined && {
          nextDueDate: parseDateOnly(dto.nextDueDate),
        }),
        ...(dto.accountId !== undefined && { accountId: dto.accountId }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.completedInstallments !== undefined && {
          completedInstallments: dto.completedInstallments,
        }),
        ...(dto.notifyDaysBefore !== undefined && {
          notifyDaysBefore: dto.notifyDaysBefore,
        }),
        ...((dto.totalInstallments !== undefined ||
          dto.frequency !== undefined) && { totalInstallments }),
      },
      include: { account: true, category: true },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.prisma.scheduledTransaction.delete({ where: { id } });
  }

  async generate(id: string, userId: string): Promise<object> {
    const scheduledTransaction = await this.findOne(id, userId);

    if (scheduledTransaction.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Cannot generate from a non-active scheduled transaction',
      );
    }

    const transaction = await this.transactionsService.create(
      {
        type: scheduledTransaction.type,
        amount: Number(scheduledTransaction.amount),
        description: scheduledTransaction.description ?? undefined,
        accountId: scheduledTransaction.accountId,
        categoryId: scheduledTransaction.categoryId,
        // Manual generation should create a settled transaction now, not a future-dated one.
        date: new Date().toISOString(),
      },
      userId,
    );

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { scheduledTransactionId: scheduledTransaction.id },
    });

    await this.prisma.scheduledTransaction.update({
      where: { id },
      data: this.getProgressUpdate(scheduledTransaction),
    });

    return transaction;
  }

  async findAllDue(): Promise<ScheduledTransaction[]> {
    const todayEnd = endOfLocalDay(new Date());

    return this.prisma.scheduledTransaction.findMany({
      where: {
        nextDueDate: { lte: todayEnd },
        status: 'ACTIVE',
        userId: { not: null },
      },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async generateFromRecord(
    scheduledTransaction: ScheduledTransaction,
  ): Promise<void> {
    const userId = scheduledTransaction.userId;
    if (!userId) return;

    const transaction = await this.transactionsService.create(
      {
        type: scheduledTransaction.type,
        amount: Number(scheduledTransaction.amount),
        description: scheduledTransaction.description ?? undefined,
        accountId: scheduledTransaction.accountId,
        categoryId: scheduledTransaction.categoryId,
        date: scheduledTransaction.nextDueDate.toISOString(),
      },
      userId,
    );

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { scheduledTransactionId: scheduledTransaction.id },
    });

    await this.prisma.scheduledTransaction.update({
      where: { id: scheduledTransaction.id },
      data: this.getProgressUpdate(scheduledTransaction),
    });
  }

  private advanceDate(from: Date, frequency: RecurringFrequency): Date {
    const originalDay = from.getUTCDate();
    const month = from.getUTCMonth();
    const year = from.getUTCFullYear();

    switch (frequency) {
      case 'ONCE':
        return new Date(from);

      case 'WEEKLY':
        return createDateOnlyUtc(year, month, originalDay + 7);

      case 'MONTHLY': {
        const nextMonth = month + 1;
        const nextYear = year + Math.floor(nextMonth / 12);
        const normalizedMonth = nextMonth % 12;
        const lastDay = new Date(
          Date.UTC(nextYear, normalizedMonth + 1, 0, 12, 0, 0, 0),
        ).getUTCDate();
        return createDateOnlyUtc(
          nextYear,
          normalizedMonth,
          Math.min(originalDay, lastDay),
        );
      }

      case 'YEARLY': {
        const nextYear = year + 1;
        const lastDay = new Date(
          Date.UTC(nextYear, month + 1, 0, 12, 0, 0, 0),
        ).getUTCDate();
        return createDateOnlyUtc(
          nextYear,
          month,
          Math.min(originalDay, lastDay),
        );
      }

      default:
        return new Date(from);
    }
  }

  private validateInstallments(
    completedInstallments: number,
    totalInstallments: number | null,
  ): void {
    if (
      totalInstallments !== null &&
      completedInstallments > totalInstallments
    ) {
      throw new BadRequestException(
        'Current installment must be less than or equal to total installments',
      );
    }
  }

  private async ensureOwnedAccount(
    accountId: string,
    userId: string,
  ): Promise<void> {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
      select: { id: true },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }
  }

  private async ensureAccessibleCategory(
    categoryId: string,
    userId: string,
  ): Promise<void> {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, OR: [{ userId }, { isSystem: true }] },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }
  }

  private getProgressUpdate(scheduledTransaction: ScheduledTransaction) {
    const nextDueDate = this.advanceDate(
      scheduledTransaction.nextDueDate,
      scheduledTransaction.frequency,
    );

    if (scheduledTransaction.frequency === 'ONCE') {
      return {
        completedInstallments: scheduledTransaction.completedInstallments + 1,
        status: 'COMPLETED' as const,
      };
    }

    if (scheduledTransaction.totalInstallments === null) {
      return {
        nextDueDate,
      };
    }

    const newCompleted = scheduledTransaction.completedInstallments + 1;
    if (newCompleted >= scheduledTransaction.totalInstallments) {
      return {
        completedInstallments: newCompleted,
        status: 'COMPLETED' as const,
      };
    }

    return {
      completedInstallments: newCompleted,
      nextDueDate,
    };
  }
}
