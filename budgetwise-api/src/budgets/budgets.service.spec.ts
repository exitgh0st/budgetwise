import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BudgetsService } from './budgets.service';
import { CopyBudgetsDto } from './dto/copy-budgets.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';

describe('BudgetsService', () => {
  const userId = 'user-1';
  const createdAt = new Date('2026-04-11T00:00:00.000Z');

  let service: BudgetsService;
  let tx: {
    budget: {
      findMany: jest.Mock;
      createMany: jest.Mock;
    };
  };
  let prisma: {
    $transaction: jest.Mock;
    category: {
      findFirst: jest.Mock;
    };
    budget: {
      upsert: jest.Mock;
    };
  };

  const makeBudgetRecord = (
    overrides: {
      id?: string;
      categoryId?: string;
      amount?: number;
      spillover?: boolean;
      month?: number;
      year?: number;
    } = {},
  ) => ({
    id: overrides.id ?? 'budget-1',
    categoryId: overrides.categoryId ?? 'category-1',
    amount: new Prisma.Decimal(overrides.amount ?? 2000),
    spillover: overrides.spillover ?? false,
    month: overrides.month ?? 4,
    year: overrides.year ?? 2026,
    userId,
    createdAt,
    updatedAt: createdAt,
    category: {
      id: overrides.categoryId ?? 'category-1',
      name: 'Food',
    },
  });

  beforeEach(async () => {
    tx = {
      budget: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    prisma = {
      $transaction: jest
        .fn()
        .mockImplementation(
          async (
            callback: (transactionClient: typeof tx) => Promise<unknown>,
          ) => callback(tx),
        ),
      category: {
        findFirst: jest.fn().mockResolvedValue({ id: 'category-1' }),
      },
      budget: {
        upsert: jest.fn().mockResolvedValue(makeBudgetRecord()),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [BudgetsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(BudgetsService);
  });

  it('upserts a new budget for the category, month, and year', async () => {
    const dto: CreateBudgetDto = {
      categoryId: 'category-1',
      amount: 2000,
      month: 4,
      year: 2026,
    };

    const result = await service.create(dto, userId);

    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'category-1',
        OR: [{ userId }, { isSystem: true }],
      },
    });
    const upsertCalls = prisma.budget.upsert.mock.calls as Array<
      [
        {
          where: {
            categoryId_month_year_userId: {
              categoryId: string;
              month: number;
              year: number;
              userId: string;
            };
          };
          update: { amount: number };
          create: {
            categoryId: string;
            amount: number;
            spillover: boolean;
            month: number;
            year: number;
            userId: string;
          };
          include: object;
        },
      ]
    >;
    const upsertCall = upsertCalls[0][0];

    expect(upsertCall.where).toEqual({
      categoryId_month_year_userId: {
        categoryId: 'category-1',
        month: 4,
        year: 2026,
        userId,
      },
    });
    expect(upsertCall.update).toEqual({
      amount: 2000,
    });
    expect(upsertCall.create).toEqual({
      categoryId: 'category-1',
      amount: 2000,
      spillover: false,
      month: 4,
      year: 2026,
      userId,
    });
    expect(upsertCall.include).toBeDefined();
    expect(result.amount).toBe(2000);
  });

  it('upserts an existing budget by updating the same category-month-year tuple', async () => {
    prisma.budget.upsert.mockResolvedValueOnce(
      makeBudgetRecord({ amount: 2500, spillover: true }),
    );

    const result = await service.create(
      {
        categoryId: 'category-1',
        amount: 2500,
        month: 4,
        year: 2026,
        spillover: true,
      },
      userId,
    );

    const upsertCalls = prisma.budget.upsert.mock.calls as Array<
      [
        {
          where: {
            categoryId_month_year_userId: {
              categoryId: string;
              month: number;
              year: number;
              userId: string;
            };
          };
          update: { amount: number; spillover: boolean };
          create: {
            categoryId: string;
            amount: number;
            spillover: boolean;
            month: number;
            year: number;
            userId: string;
          };
          include: object;
        },
      ]
    >;
    const upsertCall = upsertCalls[0][0];

    expect(upsertCall.where).toEqual({
      categoryId_month_year_userId: {
        categoryId: 'category-1',
        month: 4,
        year: 2026,
        userId,
      },
    });
    expect(upsertCall.update).toEqual({
      amount: 2500,
      spillover: true,
    });
    expect(upsertCall.create).toEqual({
      categoryId: 'category-1',
      amount: 2500,
      spillover: true,
      month: 4,
      year: 2026,
      userId,
    });
    expect(upsertCall.include).toBeDefined();
    expect(result.spillover).toBe(true);
  });

  it('copies budgets from the prior month and skips target duplicates', async () => {
    const dto: CopyBudgetsDto = {
      sourceMonth: 3,
      sourceYear: 2026,
      targetMonth: 4,
      targetYear: 2026,
    };
    tx.budget.findMany.mockResolvedValueOnce([
      {
        categoryId: 'category-1',
        amount: new Prisma.Decimal(1000),
        spillover: false,
      },
      {
        categoryId: 'category-2',
        amount: new Prisma.Decimal(1500),
        spillover: true,
      },
    ]);
    tx.budget.createMany.mockResolvedValueOnce({ count: 1 });

    const result = await service.copyFromMonth(dto, userId);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.budget.findMany).toHaveBeenCalledWith({
      where: {
        month: 3,
        year: 2026,
        userId,
      },
    });
    expect(tx.budget.createMany).toHaveBeenCalledWith({
      data: [
        {
          categoryId: 'category-1',
          amount: new Prisma.Decimal(1000),
          spillover: false,
          month: 4,
          year: 2026,
          userId,
        },
        {
          categoryId: 'category-2',
          amount: new Prisma.Decimal(1500),
          spillover: true,
          month: 4,
          year: 2026,
          userId,
        },
      ],
      skipDuplicates: true,
    });
    expect(result).toEqual({ copied: 1, skipped: 1, sourceTotal: 2 });
  });

  it('returns zero counts when the source month has no budgets to copy', async () => {
    tx.budget.findMany.mockResolvedValueOnce([]);

    const result = await service.copyFromMonth(
      {
        sourceMonth: 3,
        sourceYear: 2026,
        targetMonth: 4,
        targetYear: 2026,
      },
      userId,
    );

    expect(tx.budget.createMany).not.toHaveBeenCalled();
    expect(result).toEqual({ copied: 0, skipped: 0, sourceTotal: 0 });
  });
});
