import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RecurringFrequency,
  ScheduledTransaction,
} from '@prisma/client';
import {
  createDateOnlyUtc,
  endOfLocalDay,
  parseDateOnly,
} from '../common/date.util';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateScheduledTransactionDto } from './dto/create-scheduled-transaction.dto';
import { UpdateScheduledTransactionDto } from './dto/update-scheduled-transaction.dto';

const scheduledTransactionInclude = {
  account: true,
  category: true,
} satisfies Prisma.ScheduledTransactionInclude;

type ScheduledTransactionWithRelations = Prisma.ScheduledTransactionGetPayload<{
  include: typeof scheduledTransactionInclude;
}>;

type AccountWithMoneyFields = {
  balance: Prisma.Decimal;
  maintainingBalance: Prisma.Decimal | null;
};

type NormalizedAccount<T extends AccountWithMoneyFields> = Omit<
  T,
  'balance' | 'maintainingBalance'
> & {
  balance: number;
  maintainingBalance: number | null;
};

export type ScheduledTransactionResponse = Omit<
  ScheduledTransactionWithRelations,
  'amount' | 'account'
> & {
  amount: number;
  account: NormalizedAccount<ScheduledTransactionWithRelations['account']>;
};

export type DueScheduledTransactionResponse = Omit<
  ScheduledTransaction,
  'amount'
> & {
  amount: number;
};

@Injectable()
export class ScheduledTransactionsService {
  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
  ) {}

  async create(
    dto: CreateScheduledTransactionDto,
    userId: string,
  ): Promise<ScheduledTransactionResponse> {
    const totalInstallments =
      dto.frequency === 'ONCE' ? 1 : (dto.totalInstallments ?? null);
    const completedInstallments = dto.completedInstallments ?? 0;

    this.validateInstallments(completedInstallments, totalInstallments);
    await this.ensureOwnedAccount(dto.accountId, userId);
    await this.ensureAccessibleCategory(dto.categoryId, userId);

    const scheduledTransaction = await this.prisma.scheduledTransaction.create({
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
      include: scheduledTransactionInclude,
    });

    return this.toResponse(scheduledTransaction);
  }

  async findAll(
    userId: string,
    status?: ScheduledTransaction['status'],
  ): Promise<ScheduledTransactionResponse[]> {
    const scheduledTransactions =
      await this.prisma.scheduledTransaction.findMany({
        where: {
          userId,
          ...(status !== undefined && { status }),
        },
        include: scheduledTransactionInclude,
        orderBy: { nextDueDate: 'asc' },
        take: 250,
      });

    return scheduledTransactions.map((scheduledTransaction) =>
      this.toResponse(scheduledTransaction),
    );
  }

  async findOne(
    id: string,
    userId: string,
  ): Promise<ScheduledTransactionResponse> {
    const scheduledTransaction =
      await this.prisma.scheduledTransaction.findFirst({
        where: { id, userId },
        include: scheduledTransactionInclude,
      });
    if (!scheduledTransaction) {
      throw new NotFoundException(`Scheduled transaction ${id} not found`);
    }

    return this.toResponse(scheduledTransaction);
  }

  async update(
    id: string,
    dto: UpdateScheduledTransactionDto,
    userId: string,
  ): Promise<ScheduledTransactionResponse> {
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

    const scheduledTransaction = await this.prisma.scheduledTransaction.update({
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
      include: scheduledTransactionInclude,
    });

    return this.toResponse(scheduledTransaction);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.prisma.scheduledTransaction.delete({ where: { id } });
  }

  async generate(id: string, userId: string): Promise<object> {
    return this.prisma.$transaction(async (tx) => {
      const scheduledTransaction = await tx.scheduledTransaction.findFirst({
        where: { id, userId },
      });

      if (!scheduledTransaction) {
        throw new NotFoundException(`Scheduled transaction ${id} not found`);
      }

      if (scheduledTransaction.status !== 'ACTIVE') {
        throw new BadRequestException(
          'Cannot generate from a non-active scheduled transaction',
        );
      }

      const transaction = await this.transactionsService.createWithTx(
        tx,
        {
          type: scheduledTransaction.type,
          amount: Number(scheduledTransaction.amount),
          description: scheduledTransaction.description ?? undefined,
          accountId: scheduledTransaction.accountId,
          categoryId: scheduledTransaction.categoryId,
          // Manual generation posts a real transaction immediately, so use the current timestamp.
          date: new Date().toISOString(),
        },
        userId,
      );

      await tx.transaction.update({
        where: { id: transaction.id },
        data: { scheduledTransactionId: scheduledTransaction.id },
      });

      await tx.scheduledTransaction.update({
        where: { id },
        data: this.getProgressUpdate(scheduledTransaction),
      });

      return transaction;
    });
  }

  async findAllDue(): Promise<DueScheduledTransactionResponse[]> {
    const todayEnd = endOfLocalDay(new Date());

    const scheduledTransactions =
      await this.prisma.scheduledTransaction.findMany({
        where: {
          nextDueDate: { lte: todayEnd },
          status: 'ACTIVE',
          userId: { not: null },
        },
        orderBy: { nextDueDate: 'asc' },
      });

    return scheduledTransactions.map((scheduledTransaction) =>
      this.toDueResponse(scheduledTransaction),
    );
  }

  async generateFromRecord(
    scheduledTransaction: Pick<ScheduledTransaction, 'id' | 'userId'>,
  ): Promise<boolean> {
    const userId = scheduledTransaction.userId;
    if (!userId) return false;

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.scheduledTransaction.findUnique({
        where: { id: scheduledTransaction.id },
      });

      if (!current || current.status !== 'ACTIVE') {
        return false;
      }

      if (current.nextDueDate.getTime() > endOfLocalDay(new Date()).getTime()) {
        return false;
      }

      const transaction = await this.transactionsService.createWithTx(
        tx,
        {
          type: current.type,
          amount: Number(current.amount),
          description: current.description ?? undefined,
          accountId: current.accountId,
          categoryId: current.categoryId,
          date: current.nextDueDate.toISOString(),
        },
        userId,
      );

      await tx.transaction.update({
        where: { id: transaction.id },
        data: { scheduledTransactionId: current.id },
      });

      await tx.scheduledTransaction.update({
        where: { id: current.id },
        data: this.getProgressUpdate(current),
      });

      return true;
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

  private normalizeAccount<T extends AccountWithMoneyFields>(
    account: T,
  ): NormalizedAccount<T> {
    return {
      ...account,
      balance: Number(account.balance),
      maintainingBalance:
        account.maintainingBalance === null
          ? null
          : Number(account.maintainingBalance),
    };
  }

  private toResponse(
    scheduledTransaction: ScheduledTransactionWithRelations,
  ): ScheduledTransactionResponse {
    return {
      ...scheduledTransaction,
      amount: Number(scheduledTransaction.amount),
      account: this.normalizeAccount(scheduledTransaction.account),
    };
  }

  private toDueResponse(
    scheduledTransaction: ScheduledTransaction,
  ): DueScheduledTransactionResponse {
    return {
      ...scheduledTransaction,
      amount: Number(scheduledTransaction.amount),
    };
  }
}
