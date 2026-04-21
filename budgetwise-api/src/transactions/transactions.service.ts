import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { USER_LIMITS } from '../common/constants/limits';
import { parseDateBoundary, parseDateOnly } from '../common/date.util';
import { PrismaService } from '../prisma/prisma.service';
import { ReportCacheService } from '../reports/report-cache.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

/** Shared include for all transaction queries so response shape is consistent. */
const transactionInclude = {
  account: true,
  fromAccount: true,
  toAccount: true,
  category: true,
} satisfies Prisma.TransactionInclude;

type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: typeof transactionInclude;
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

type TransactionAccount = NonNullable<TransactionWithRelations['account']>;

export type TransactionResponse = Omit<
  TransactionWithRelations,
  'amount' | 'account' | 'fromAccount' | 'toAccount'
> & {
  amount: number;
  account: NormalizedAccount<TransactionAccount> | null;
  fromAccount: NormalizedAccount<TransactionAccount> | null;
  toAccount: NormalizedAccount<TransactionAccount> | null;
};

/** Paginated list response returned by `findAll`. */
export interface PaginatedTransactionsResponse {
  data: TransactionResponse[];
  total: number;
  limit: number | undefined;
  offset: number | undefined;
}

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private reportCache: ReportCacheService,
  ) {}

  /**
   * Creates a transaction and updates account balances atomically.
   * Enforces the per-user transaction limit before writing.
   *
   * @throws BadRequestException when the transaction limit is reached or validation fails
   */
  async create(
    dto: CreateTransactionDto,
    userId: string,
  ): Promise<TransactionResponse> {
    const count = await this.prisma.transaction.count({ where: { userId } });
    if (count >= USER_LIMITS.transactions) {
      throw new BadRequestException(
        `Transaction limit reached (${count}/${USER_LIMITS.transactions}). Export and delete old transactions to continue.`,
      );
    }

    const transaction = await this.prisma.$transaction((tx) =>
      this.createRawInTransaction(tx, dto, userId),
    );
    await this.reportCache.invalidateUser(userId);

    return this.toResponse(transaction);
  }

  /**
   * Creates a transaction within an existing Prisma transaction.
   * Use this when the caller already owns a DB transaction context (e.g. account creation).
   * Also invalidates the report cache after the write.
   */
  async createWithTx(
    tx: Prisma.TransactionClient,
    dto: CreateTransactionDto,
    userId: string,
  ): Promise<TransactionResponse> {
    const transaction = await this.createRawInTransaction(tx, dto, userId);
    await this.reportCache.invalidateUser(userId);

    return this.toResponse(transaction);
  }

  /**
   * Alias of `createWithTx` used by goal contributions to keep call sites readable.
   * Both variants delegate to `createRawInTransaction`.
   */
  async createInTransaction(
    tx: Prisma.TransactionClient,
    dto: CreateTransactionDto,
    userId: string,
  ): Promise<TransactionResponse> {
    const transaction = await this.createRawInTransaction(tx, dto, userId);
    await this.reportCache.invalidateUser(userId);

    return this.toResponse(transaction);
  }

  /**
   * Returns a paginated, filtered list of transactions for the user.
   * Account filter matches any of the three account columns (account, fromAccount, toAccount)
   * to correctly include transfer transactions in per-account views.
   */
  async findAll(
    filters: FilterTransactionsDto,
    userId: string,
  ): Promise<PaginatedTransactionsResponse> {
    const where: Prisma.TransactionWhereInput = { userId };
    const search = filters.search?.trim();
    const limit = Math.min(filters.limit ?? 20, 100);
    const offset = filters.offset ?? 0;

    if (filters.accountId) {
      // Transfers use fromAccountId/toAccountId instead of accountId, so we
      // must check all three columns when filtering by account.
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
    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [data, total]: [TransactionWithRelations[], number] =
      await Promise.all([
        this.prisma.transaction.findMany({
          where,
          include: transactionInclude,
          orderBy: { date: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.transaction.count({ where }),
      ]);

    return {
      data: data.map((transaction) => this.toResponse(transaction)),
      total,
      limit,
      offset,
    };
  }

  async findOne(id: string, userId: string): Promise<TransactionResponse> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: transactionInclude,
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    return this.toResponse(transaction);
  }

  /**
   * Updates a transaction's fields and re-applies balance effects atomically:
   * 1. Reverses the original balance impact
   * 2. Applies the new balance impact
   *
   * Goal-linked contribution transactions are restricted from changing their
   * transaction type because the goal type determines the required type.
   *
   * @throws NotFoundException when the transaction does not exist for the user
   * @throws BadRequestException when a goal-linked transaction tries to change type
   */
  async update(
    id: string,
    dto: UpdateTransactionDto,
    userId: string,
  ): Promise<TransactionResponse> {
    const transaction = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findFirst({
        where: { id, userId },
      });
      if (!existing) {
        throw new NotFoundException(`Transaction ${id} not found`);
      }

      // Goal contributions are tied to a specific transaction type (TRANSFER for SAVINGS,
      // EXPENSE for DEBT_PAYOFF). Reject type changes that would break that invariant.
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
    await this.reportCache.invalidateUser(userId);

    return this.toResponse(transaction);
  }

  /**
   * Deletes a transaction and reverses its balance effect on the affected account(s).
   * @throws NotFoundException when the transaction does not exist for the user
   */
  async remove(id: string, userId: string): Promise<TransactionResponse> {
    const transaction = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: { id, userId },
      });
      if (!transaction) {
        throw new NotFoundException(`Transaction ${id} not found`);
      }

      await this.reverseBalanceEffect(tx, transaction);

      return tx.transaction.delete({
        where: { id },
        include: transactionInclude,
      });
    });
    await this.reportCache.invalidateUser(userId);

    return this.toResponse(transaction);
  }

  /**
   * Core write path: validates shape, persists the record, and applies balance effects.
   * All public create variants delegate here so the logic lives in one place.
   */
  private async createRawInTransaction(
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

  /**
   * Validates account/category ownership and normalises the transaction shape.
   * TRANSFER → uses fromAccountId + toAccountId, nulls accountId.
   * INCOME/EXPENSE → uses accountId + categoryId, nulls transfer fields.
   *
   * @throws BadRequestException for missing required fields or same-account transfers
   * @throws NotFoundException for accounts/categories not accessible to the user
   */
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

  /**
   * Undoes a transaction's balance effect by negating the amount.
   * Used before updating or deleting a transaction so the old impact is first removed.
   */
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

  /**
   * Applies a transaction's balance effect to the relevant account(s) using atomic increments.
   * TRANSFER: debits fromAccount, credits toAccount.
   * INCOME: credits accountId; EXPENSE: debits accountId.
   * Negative `amount` (used by `reverseBalanceEffect`) inverts the direction.
   */
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

  private normalizeAccount<T extends AccountWithMoneyFields>(
    account: T | null,
  ): NormalizedAccount<T> | null {
    if (!account) {
      return null;
    }

    return {
      ...account,
      balance: Number(account.balance),
      maintainingBalance:
        account.maintainingBalance === null
          ? null
          : Number(account.maintainingBalance),
    };
  }

  /** Converts Prisma Decimal fields to plain numbers for JSON serialization. */
  private toResponse(
    transaction: TransactionWithRelations,
  ): TransactionResponse {
    return {
      ...transaction,
      amount: Number(transaction.amount),
      account: this.normalizeAccount(transaction.account),
      fromAccount: this.normalizeAccount(transaction.fromAccount),
      toAccount: this.normalizeAccount(transaction.toAccount),
    };
  }
}
