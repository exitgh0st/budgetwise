import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GoalType, Prisma, TransactionType } from '@prisma/client';
import { USER_LIMITS } from '../common/constants/limits';
import { parseDateOnly } from '../common/date.util';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { ContributeGoalDto } from './dto/contribute-goal.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

const goalAccountSelect = {
  id: true,
  name: true,
  type: true,
  balance: true,
  maintainingBalance: true,
  providerId: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AccountSelect;

const goalCategorySelect = {
  id: true,
  name: true,
  icon: true,
  isSystem: true,
  userId: true,
  createdAt: true,
} satisfies Prisma.CategorySelect;

const goalTransactionSelect = {
  id: true,
  type: true,
  amount: true,
  description: true,
  date: true,
  accountId: true,
  fromAccountId: true,
  toAccountId: true,
  categoryId: true,
  scheduledTransactionId: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: goalCategorySelect,
  },
  account: {
    select: goalAccountSelect,
  },
  fromAccount: {
    select: goalAccountSelect,
  },
  toAccount: {
    select: goalAccountSelect,
  },
} satisfies Prisma.TransactionSelect;

const goalInclude = {
  account: {
    select: goalAccountSelect,
  },
  contributions: {
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      transaction: {
        select: goalTransactionSelect,
      },
    },
  },
} satisfies Prisma.GoalInclude;

type GoalWithRelations = Prisma.GoalGetPayload<{
  include: typeof goalInclude;
}>;

type GoalResponse = Omit<
  GoalWithRelations,
  'currentAmount' | 'targetAmount' | 'account' | 'contributions'
> & {
  currentAmount: number;
  targetAmount: number;
  contributionCount: number;
  linkedTransactions: Array<
    Omit<
      GoalWithRelations['contributions'][number]['transaction'],
      'amount' | 'account' | 'fromAccount' | 'toAccount'
    > & {
      amount: number;
      account:
        | (Omit<
            NonNullable<
              GoalWithRelations['contributions'][number]['transaction']['account']
            >,
            'balance' | 'maintainingBalance'
          > & {
            balance: number;
            maintainingBalance: number | null;
          })
        | null;
      fromAccount:
        | (Omit<
            NonNullable<
              GoalWithRelations['contributions'][number]['transaction']['fromAccount']
            >,
            'balance' | 'maintainingBalance'
          > & {
            balance: number;
            maintainingBalance: number | null;
          })
        | null;
      toAccount:
        | (Omit<
            NonNullable<
              GoalWithRelations['contributions'][number]['transaction']['toAccount']
            >,
            'balance' | 'maintainingBalance'
          > & {
            balance: number;
            maintainingBalance: number | null;
          })
        | null;
    }
  >;
  account:
    | (Omit<
        NonNullable<GoalWithRelations['account']>,
        'balance' | 'maintainingBalance'
      > & {
        balance: number;
        maintainingBalance: number | null;
      })
    | null;
};

/**
 * Manages financial goals (SAVINGS and DEBT_PAYOFF) and their linked contribution transactions.
 * Contributions are always real transactions: TRANSFER for SAVINGS (money moves to the
 * goal account) and EXPENSE for DEBT_PAYOFF (money leaves an account).
 */
@Injectable()
export class GoalsService {
  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
  ) {}

  /**
   * Creates a new financial goal.
   * SAVINGS goals require a linked account upfront; DEBT_PAYOFF goals do not use an account.
   *
   * @throws BadRequestException when the user hits the goal limit or required fields are missing
   * @throws NotFoundException when the linked account is not owned by the user
   */
  async create(dto: CreateGoalDto, userId: string): Promise<GoalResponse> {
    const count = await this.prisma.goal.count({ where: { userId } });
    if (count >= USER_LIMITS.goals) {
      throw new BadRequestException(
        `Goal limit reached (${count}/${USER_LIMITS.goals}). Delete completed goals to create new ones.`,
      );
    }

    await this.validateGoalFields(dto.type, dto.accountId ?? null, userId);

    const goal = await this.prisma.goal.create({
      data: {
        type: dto.type,
        name: dto.name,
        targetAmount: dto.targetAmount,
        targetDate: dto.targetDate ? parseDateOnly(dto.targetDate) : null,
        accountId:
          dto.type === GoalType.SAVINGS ? (dto.accountId ?? null) : null,
        userId,
      },
      include: goalInclude,
    });

    return this.toResponse(goal);
  }

  async findAll(userId: string): Promise<GoalResponse[]> {
    const goals = await this.prisma.goal.findMany({
      where: { userId },
      include: goalInclude,
      orderBy: [{ targetDate: 'asc' }, { createdAt: 'desc' }],
      take: 100,
    });

    return goals.map((goal) => this.toResponse(goal));
  }

  async findOne(id: string, userId: string): Promise<GoalResponse> {
    const goal = await this.getGoalOrThrow(id, userId);
    return this.toResponse(goal);
  }

  /**
   * Updates a goal's mutable fields.
   * Goal type is immutable after creation because the contribution transaction
   * type is derived from it.
   *
   * @throws BadRequestException when attempting to change the goal type
   * @throws NotFoundException when the goal does not exist or belongs to another user
   */
  async update(
    id: string,
    dto: UpdateGoalDto,
    userId: string,
  ): Promise<GoalResponse> {
    const existing = await this.getGoalOrThrow(id, userId);

    if (dto.type && dto.type !== existing.type) {
      throw new BadRequestException(
        'Goal type cannot be changed after creation',
      );
    }

    const accountId =
      dto.accountId !== undefined
        ? (dto.accountId ?? null)
        : existing.accountId;

    await this.validateGoalFields(existing.type, accountId, userId);

    const goal = await this.prisma.goal.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.targetAmount !== undefined && {
          targetAmount: dto.targetAmount,
        }),
        ...(dto.targetDate !== undefined && {
          targetDate: dto.targetDate ? parseDateOnly(dto.targetDate) : null,
        }),
        ...(existing.type === GoalType.SAVINGS && {
          accountId,
        }),
        ...(existing.type === GoalType.DEBT_PAYOFF && {
          accountId: null,
        }),
      },
      include: goalInclude,
    });

    return this.toResponse(goal);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.prisma.goal.delete({ where: { id } });
  }

  /**
   * Records a contribution toward a goal by creating a linked transaction.
   * SAVINGS → TRANSFER from `fromAccountId` to the goal account.
   * DEBT_PAYOFF → EXPENSE from `fromAccountId`.
   *
   * The contribution is linked via a `GoalContribution` record so it is
   * tracked separately from regular transactions.
   *
   * @throws NotFoundException when the goal is not found
   */
  async contribute(
    id: string,
    dto: ContributeGoalDto,
    userId: string,
  ): Promise<GoalResponse> {
    const result = await this.prisma.$transaction(async (tx) => {
      const goal = await tx.goal.findFirst({
        where: { id, userId },
        include: goalInclude,
      });

      if (!goal) {
        throw new NotFoundException(`Goal ${id} not found`);
      }

      const transaction =
        goal.type === GoalType.SAVINGS
          ? await this.createSavingsContribution(tx, goal, dto, userId)
          : await this.createDebtContribution(tx, goal, dto, userId);

      await tx.goalContribution.create({
        data: {
          goalId: goal.id,
          transactionId: transaction.id,
        },
      });

      return tx.goal.findFirstOrThrow({
        where: { id: goal.id },
        include: goalInclude,
      });
    });

    return this.toResponse(result);
  }

  private async createSavingsContribution(
    tx: Prisma.TransactionClient,
    goal: GoalWithRelations,
    dto: ContributeGoalDto,
    userId: string,
  ) {
    if (!goal.accountId) {
      throw new BadRequestException(
        'Savings goals require a linked account before contributions can be added',
      );
    }

    if (dto.fromAccountId === goal.accountId) {
      throw new BadRequestException(
        'Funding account must be different from the goal account',
      );
    }

    const categoryId = await this.resolveContributionCategory(
      tx,
      goal.type,
      dto.categoryId,
      userId,
    );

    return this.transactionsService.createInTransaction(
      tx,
      {
        type: TransactionType.TRANSFER,
        amount: dto.amount,
        fromAccountId: dto.fromAccountId,
        toAccountId: goal.accountId,
        categoryId,
        description: dto.description ?? `Contribution to ${goal.name}`,
        date: new Date().toISOString(),
      },
      userId,
    );
  }

  private async createDebtContribution(
    tx: Prisma.TransactionClient,
    goal: GoalWithRelations,
    dto: ContributeGoalDto,
    userId: string,
  ) {
    const categoryId = await this.resolveContributionCategory(
      tx,
      goal.type,
      dto.categoryId,
      userId,
    );

    return this.transactionsService.createInTransaction(
      tx,
      {
        type: TransactionType.EXPENSE,
        amount: dto.amount,
        accountId: dto.fromAccountId,
        categoryId,
        description: dto.description ?? `Contribution to ${goal.name}`,
        date: new Date().toISOString(),
      },
      userId,
    );
  }

  private async getGoalOrThrow(
    id: string,
    userId: string,
  ): Promise<GoalWithRelations> {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId },
      include: goalInclude,
    });

    if (!goal) {
      throw new NotFoundException(`Goal ${id} not found`);
    }

    return goal;
  }

  private async validateGoalFields(
    type: GoalType,
    accountId: string | null,
    userId: string,
  ): Promise<void> {
    if (type === GoalType.SAVINGS) {
      if (!accountId) {
        throw new BadRequestException('Savings goals require a linked account');
      }

      await this.ensureOwnedAccount(accountId, userId);
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
    tx: Prisma.TransactionClient,
    categoryId: string,
    userId: string,
  ): Promise<void> {
    const category = await tx.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ userId }, { userId: null }, { isSystem: true }],
      },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }
  }

  /**
   * Resolves the category to use for a contribution transaction.
   * If the caller provides a categoryId it is validated and returned.
   * Otherwise, auto-selects or creates the default "Savings" / "Debt" category.
   *
   * The try/catch on P2002 handles a race condition: two simultaneous contributions
   * may both find no existing category and attempt to create it — the loser catches
   * the unique-constraint error and re-fetches the winner's record.
   */
  private async resolveContributionCategory(
    tx: Prisma.TransactionClient,
    type: GoalType,
    categoryId: string | undefined,
    userId: string,
  ): Promise<string> {
    if (categoryId) {
      await this.ensureAccessibleCategory(tx, categoryId, userId);
      return categoryId;
    }

    const name = type === GoalType.SAVINGS ? 'Savings' : 'Debt';

    const existing = await tx.category.findFirst({
      where: {
        name,
        OR: [{ userId }, { isSystem: true }, { userId: null }],
      },
      // Prefer user-owned over system so personal renames are respected
      orderBy: [{ isSystem: 'desc' }, { userId: 'desc' }],
      select: { id: true },
    });

    if (existing) {
      await this.ensureAccessibleCategory(tx, existing.id, userId);
      return existing.id;
    }

    try {
      const created = await tx.category.create({
        data: {
          name,
          icon: type === GoalType.SAVINGS ? '💰' : '💳',
          userId,
          isSystem: true,
        },
        select: { id: true },
      });

      return created.id;
    } catch (error) {
      // P2002: race condition — another request created the same category first.
      // Re-fetch rather than failing.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const conflicted = await tx.category.findFirstOrThrow({
          where: { name, userId },
          select: { id: true },
        });

        return conflicted.id;
      }

      throw error;
    }
  }

  /**
   * Converts the raw DB payload into the API response shape.
   * Computes `currentAmount` by summing contribution transaction amounts,
   * and converts all Prisma Decimal fields to plain numbers.
   */
  private toResponse(goal: GoalWithRelations): GoalResponse {
    const currentAmount = goal.contributions.reduce(
      (sum, contribution) => sum + Number(contribution.transaction.amount),
      0,
    );
    const { contributions, ...rest } = goal;

    return {
      ...rest,
      currentAmount,
      targetAmount: Number(goal.targetAmount),
      contributionCount: contributions.length,
      linkedTransactions: contributions.map((contribution) => ({
        ...contribution.transaction,
        amount: Number(contribution.transaction.amount),
        account: contribution.transaction.account
          ? {
              ...contribution.transaction.account,
              balance: Number(contribution.transaction.account.balance),
              maintainingBalance:
                contribution.transaction.account.maintainingBalance === null
                  ? null
                  : Number(contribution.transaction.account.maintainingBalance),
            }
          : null,
        fromAccount: contribution.transaction.fromAccount
          ? {
              ...contribution.transaction.fromAccount,
              balance: Number(contribution.transaction.fromAccount.balance),
              maintainingBalance:
                contribution.transaction.fromAccount.maintainingBalance === null
                  ? null
                  : Number(
                      contribution.transaction.fromAccount.maintainingBalance,
                    ),
            }
          : null,
        toAccount: contribution.transaction.toAccount
          ? {
              ...contribution.transaction.toAccount,
              balance: Number(contribution.transaction.toAccount.balance),
              maintainingBalance:
                contribution.transaction.toAccount.maintainingBalance === null
                  ? null
                  : Number(
                      contribution.transaction.toAccount.maintainingBalance,
                    ),
            }
          : null,
      })),
      account: goal.account
        ? {
            ...goal.account,
            balance: Number(goal.account.balance),
            maintainingBalance:
              goal.account.maintainingBalance === null
                ? null
                : Number(goal.account.maintainingBalance),
          }
        : null,
    };
  }
}
