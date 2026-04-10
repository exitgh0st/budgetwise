import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { parseDateBoundary, parseDateOnly } from '../common/date.util';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';

const transactionInclude = {
  account: true,
  fromAccount: true,
  toAccount: true,
  category: true,
} satisfies Prisma.TransactionInclude;

type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: typeof transactionInclude;
}>;

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(
    dto: CreateTransactionDto,
    userId: string,
  ): Promise<TransactionWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      return this.createInTransaction(tx, dto, userId);
    });
  }

  async createInTransaction(
    tx: Prisma.TransactionClient,
    dto: CreateTransactionDto,
    userId: string,
  ): Promise<TransactionWithRelations> {
    const normalized = await this.resolveTransactionShape(tx, dto, userId);
    const date = dto.date ? parseDateOnly(dto.date) : new Date();

    const transaction = await tx.transaction.create({
      data: {
        type: normalized.type,
        amount: dto.amount,
        description: dto.description,
        date,
        accountId: normalized.accountId,
        fromAccountId: normalized.fromAccountId,
        toAccountId: normalized.toAccountId,
        categoryId: normalized.categoryId,
        userId,
      },
      include: transactionInclude,
    });

    await this.applyBalanceEffect(tx, {
      type: normalized.type,
      amount: dto.amount,
      accountId: normalized.accountId,
      fromAccountId: normalized.fromAccountId,
      toAccountId: normalized.toAccountId,
    });

    return transaction;
  }

  async findAll(filters: FilterTransactionsDto, userId: string) {
    const where: Prisma.TransactionWhereInput = { userId };

    if (filters.accountId) {
      where.OR = [
        { accountId: filters.accountId },
        { fromAccountId: filters.accountId },
        { toAccountId: filters.accountId },
      ];
    }
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.type) where.type = filters.type;
    if (filters.startDate || filters.endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filters.startDate) {
        dateFilter.gte = parseDateBoundary(filters.startDate, 'start');
      }
      if (filters.endDate) {
        dateFilter.lte = parseDateBoundary(filters.endDate, 'end');
      }
      where.date = dateFilter;
    }

    const [data, total]: [TransactionWithRelations[], number] =
      await Promise.all([
        this.prisma.transaction.findMany({
          where,
          include: transactionInclude,
          orderBy: { date: 'desc' },
          take: filters.limit,
          skip: filters.offset,
        }),
        this.prisma.transaction.count({ where }),
      ]);

    return { data, total, limit: filters.limit, offset: filters.offset };
  }

  async findOne(id: string, userId: string): Promise<TransactionWithRelations> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: transactionInclude,
    });
    if (!transaction)
      throw new NotFoundException(`Transaction ${id} not found`);
    return transaction;
  }

  async update(
    id: string,
    dto: UpdateTransactionDto,
    userId: string,
  ): Promise<TransactionWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findFirst({
        where: { id, userId },
      });
      if (!existing) throw new NotFoundException(`Transaction ${id} not found`);

      const linkedContribution = await tx.goalContribution.findUnique({
        where: { transactionId: id },
        include: { goal: true },
      });
      if (linkedContribution) {
        const nextType = dto.type ?? existing.type;
        const requiredType =
          linkedContribution.goal.type === 'SAVINGS'
            ? TransactionType.TRANSFER
            : TransactionType.EXPENSE;

        if (nextType !== requiredType) {
          throw new BadRequestException(
            'Linked contribution transactions cannot change to an invalid transaction type',
          );
        }
      }

      const newDate = dto.date ? parseDateOnly(dto.date) : existing.date;
      const newType = dto.type ?? existing.type;
      const newAmount = dto.amount ?? Number(existing.amount);
      const resolved = await this.resolveTransactionShape(
        tx,
        {
          type: newType,
          accountId: dto.accountId ?? existing.accountId ?? undefined,
          fromAccountId:
            dto.fromAccountId ?? existing.fromAccountId ?? undefined,
          toAccountId: dto.toAccountId ?? existing.toAccountId ?? undefined,
          categoryId: dto.categoryId ?? existing.categoryId ?? undefined,
        },
        userId,
      );

      await this.reverseBalanceEffect(tx, existing);

      const updated = await tx.transaction.update({
        where: { id },
        data: {
          type: resolved.type,
          amount: newAmount,
          description: dto.description ?? existing.description,
          date: newDate,
          accountId: resolved.accountId,
          fromAccountId: resolved.fromAccountId,
          toAccountId: resolved.toAccountId,
          categoryId: resolved.categoryId,
        },
        include: transactionInclude,
      });

      await this.applyBalanceEffect(tx, {
        type: resolved.type,
        amount: newAmount,
        accountId: resolved.accountId,
        fromAccountId: resolved.fromAccountId,
        toAccountId: resolved.toAccountId,
      });

      return updated;
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: { id, userId },
      });
      if (!transaction)
        throw new NotFoundException(`Transaction ${id} not found`);

      await this.reverseBalanceEffect(tx, transaction);

      return tx.transaction.delete({ where: { id } });
    });
  }

  private async resolveTransactionShape(
    tx: Prisma.TransactionClient,
    dto: Pick<
      CreateTransactionDto,
      'type' | 'accountId' | 'fromAccountId' | 'toAccountId' | 'categoryId'
    >,
    userId: string,
  ) {
    if (dto.type === TransactionType.TRANSFER) {
      if (!dto.fromAccountId || !dto.toAccountId) {
        throw new BadRequestException(
          'Transfer transactions require fromAccountId and toAccountId',
        );
      }

      if (dto.fromAccountId === dto.toAccountId) {
        throw new BadRequestException(
          'Transfer source and destination accounts must be different',
        );
      }

      await this.ensureOwnedAccount(tx, dto.fromAccountId, userId);
      await this.ensureOwnedAccount(tx, dto.toAccountId, userId);
      if (dto.categoryId) {
        await this.ensureAccessibleCategory(tx, dto.categoryId, userId);
      }

      return {
        type: TransactionType.TRANSFER,
        accountId: null,
        fromAccountId: dto.fromAccountId,
        toAccountId: dto.toAccountId,
        categoryId: dto.categoryId ?? null,
      };
    }

    if (!dto.accountId || !dto.categoryId) {
      throw new BadRequestException(
        `${dto.type} transactions require accountId and categoryId`,
      );
    }

    await this.ensureOwnedAccount(tx, dto.accountId, userId);
    await this.ensureAccessibleCategory(tx, dto.categoryId, userId);

    return {
      type: dto.type,
      accountId: dto.accountId,
      fromAccountId: null,
      toAccountId: null,
      categoryId: dto.categoryId,
    };
  }

  private async ensureOwnedAccount(
    tx: Prisma.TransactionClient,
    accountId: string,
    userId: string,
  ) {
    const account = await tx.account.findFirst({
      where: { id: accountId, userId },
      select: { id: true },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }
  }

  private async ensureAccessibleCategory(
    tx: Prisma.TransactionClient,
    categoryId: string,
    userId: string,
  ) {
    const category = await tx.category.findFirst({
      where: { id: categoryId, OR: [{ userId }, { isSystem: true }] },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }
  }

  private async reverseBalanceEffect(
    tx: Prisma.TransactionClient,
    transaction: {
      type: TransactionType;
      amount: Prisma.Decimal | number;
      accountId: string | null;
      fromAccountId: string | null;
      toAccountId: string | null;
    },
  ) {
    await this.applyBalanceEffect(tx, {
      type: transaction.type,
      amount: -Number(transaction.amount),
      accountId: transaction.accountId,
      fromAccountId: transaction.fromAccountId,
      toAccountId: transaction.toAccountId,
    });
  }

  private async applyBalanceEffect(
    tx: Prisma.TransactionClient,
    transaction: {
      type: TransactionType;
      amount: number;
      accountId: string | null;
      fromAccountId: string | null;
      toAccountId: string | null;
    },
  ) {
    if (transaction.type === TransactionType.TRANSFER) {
      if (!transaction.fromAccountId || !transaction.toAccountId) {
        throw new BadRequestException(
          'Transfer transactions require fromAccountId and toAccountId',
        );
      }

      await tx.account.update({
        where: { id: transaction.fromAccountId },
        data: { balance: { increment: -transaction.amount } },
      });

      await tx.account.update({
        where: { id: transaction.toAccountId },
        data: { balance: { increment: transaction.amount } },
      });

      return;
    }

    if (!transaction.accountId) {
      throw new BadRequestException(
        `${transaction.type} transactions require accountId`,
      );
    }

    const balanceChange =
      transaction.type === TransactionType.EXPENSE
        ? -transaction.amount
        : transaction.amount;

    await tx.account.update({
      where: { id: transaction.accountId },
      data: { balance: { increment: balanceChange } },
    });
  }
}
