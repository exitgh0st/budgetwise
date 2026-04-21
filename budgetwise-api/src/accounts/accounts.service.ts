import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Account, TransactionType } from '@prisma/client';
import { USER_LIMITS } from '../common/constants/limits';
import { PrismaService } from '../prisma/prisma.service';
import { ReportCacheService } from '../reports/report-cache.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { TransactionsService } from '../transactions/transactions.service';

/**
 * API response shape for an account.
 * Prisma stores `balance` and `maintainingBalance` as `Decimal`; they are
 * converted to `number` before leaving the service layer.
 */
export type AccountResponse = Omit<
  Account,
  'balance' | 'maintainingBalance'
> & {
  balance: number;
  maintainingBalance: number | null;
};

@Injectable()
export class AccountsService {
  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
    private reportCache: ReportCacheService,
  ) {}

  /**
   * Creates a new account. If an opening balance is provided, an adjustment
   * transaction is created in the same DB transaction to record the initial
   * balance as INCOME (positive) or EXPENSE (negative), keeping ledger integrity.
   *
   * @throws BadRequestException when the user hits the account limit or the
   *   seed Adjustment category is missing
   */
  async create(
    dto: CreateAccountDto,
    userId: string,
  ): Promise<AccountResponse> {
    const count = await this.prisma.account.count({ where: { userId } });
    if (count >= USER_LIMITS.accounts) {
      throw new BadRequestException(
        `Account limit reached (${count}/${USER_LIMITS.accounts}). Delete unused accounts to create new ones.`,
      );
    }

    const openingBalance = dto.balance ?? 0;
    const account = await this.prisma.$transaction(async (tx) => {
      // Always create the account with balance 0; the opening balance is
      // applied via a transaction so the audit trail is preserved.
      const createdAccount = await tx.account.create({
        data: {
          name: dto.name,
          type: dto.type,
          balance: 0,
          maintainingBalance: dto.maintainingBalance ?? null,
          providerId: dto.providerId ?? null,
          userId,
        },
      });

      if (openingBalance === 0) {
        return createdAccount;
      }

      const adjustmentCategory = await tx.category.findFirst({
        where: { name: 'Adjustment', isSystem: true },
        select: { id: true },
      });

      if (!adjustmentCategory) {
        throw new BadRequestException(
          'Adjustment category not found. Please run database seed.',
        );
      }

      await this.transactionsService.createWithTx(
        tx,
        {
          type:
            openingBalance > 0
              ? TransactionType.INCOME
              : TransactionType.EXPENSE,
          amount: Math.abs(openingBalance),
          description: `${dto.name} opening balance`,
          accountId: createdAccount.id,
          categoryId: adjustmentCategory.id,
        },
        userId,
      );

      // Re-fetch because createWithTx updated the balance via an increment
      const updatedAccount = await tx.account.findUnique({
        where: { id: createdAccount.id },
      });

      if (!updatedAccount) {
        throw new NotFoundException(`Account ${createdAccount.id} not found`);
      }

      return updatedAccount;
    });
    await this.reportCache.invalidateUser(userId);

    return this.toResponse(account);
  }

  /** Returns all accounts for a user, ordered by creation date (oldest first). */
  async findAll(userId: string): Promise<AccountResponse[]> {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 250,
    });

    return accounts.map((account) => this.toResponse(account));
  }

  /**
   * Returns a single account by ID, scoped to the requesting user.
   * @throws NotFoundException when the account does not exist or belongs to another user
   */
  async findOne(id: string, userId: string): Promise<AccountResponse> {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });

    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }

    return this.toResponse(account);
  }

  async update(
    id: string,
    dto: UpdateAccountDto,
    userId: string,
  ): Promise<AccountResponse> {
    await this.findOne(id, userId);

    const account = await this.prisma.account.update({
      where: { id },
      data: dto,
    });
    await this.reportCache.invalidateUser(userId);

    return this.toResponse(account);
  }

  async remove(id: string, userId: string): Promise<AccountResponse> {
    await this.findOne(id, userId);

    const account = await this.prisma.account.delete({ where: { id } });
    await this.reportCache.invalidateUser(userId);

    return this.toResponse(account);
  }

  /**
   * Sets an account balance to an exact value by recording an adjustment transaction
   * for the difference. The transaction type is INCOME when the balance increases
   * and EXPENSE when it decreases, preserving a correct audit trail.
   *
   * @throws NotFoundException when the account is not found
   * @throws BadRequestException when the Adjustment system category is missing
   */
  async adjustBalance(
    id: string,
    newBalance: number,
    userId: string,
  ): Promise<AccountResponse> {
    const account = await this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({ where: { id, userId } });
      if (!account) {
        throw new NotFoundException(`Account ${id} not found`);
      }

      const currentBalance = Number(account.balance);
      const diff = newBalance - currentBalance;

      if (diff === 0) {
        return account;
      }

      const adjustmentCategory = await tx.category.findFirst({
        where: { name: 'Adjustment', isSystem: true },
      });
      if (!adjustmentCategory) {
        throw new BadRequestException(
          'Adjustment category not found. Please run database seed.',
        );
      }

      const type = diff > 0 ? 'INCOME' : 'EXPENSE';
      const amount = Math.abs(diff);

      await tx.transaction.create({
        data: {
          type,
          amount,
          description: `${account.name} adjustment`,
          date: new Date(),
          accountId: id,
          categoryId: adjustmentCategory.id,
          userId,
        },
      });

      return tx.account.update({
        where: { id },
        data: { balance: newBalance },
      });
    });
    await this.reportCache.invalidateUser(userId);

    return this.toResponse(account);
  }

  /** Converts Prisma Decimal fields to plain numbers for JSON serialization. */
  private toResponse(account: Account): AccountResponse {
    return {
      ...account,
      balance: Number(account.balance),
      maintainingBalance:
        account.maintainingBalance === null
          ? null
          : Number(account.maintainingBalance),
    };
  }
}
