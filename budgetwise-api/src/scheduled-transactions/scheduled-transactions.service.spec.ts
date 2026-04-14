import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AccountType,
  Prisma,
  RecurringFrequency,
  ScheduledTransaction,
  ScheduledTransactionStatus,
  TransactionType,
} from '@prisma/client';
import { endOfLocalDay } from '../common/date.util';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateScheduledTransactionDto } from './dto/create-scheduled-transaction.dto';
import { UpdateScheduledTransactionDto } from './dto/update-scheduled-transaction.dto';
import { ScheduledTransactionsService } from './scheduled-transactions.service';

describe('ScheduledTransactionsService', () => {
  const userId = 'user-1';
  const scheduledTransactionId = 'scheduled-1';
  const createdAt = new Date('2026-04-10T00:00:00.000Z');

  let service: ScheduledTransactionsService;
  let tx: {
    scheduledTransaction: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    transaction: {
      update: jest.Mock;
    };
  };
  let prisma: {
    $transaction: jest.Mock;
    account: { findFirst: jest.Mock };
    category: { findFirst: jest.Mock };
    scheduledTransaction: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    transaction: {
      update: jest.Mock;
    };
  };
  let transactionsService: {
    createWithTx: jest.Mock;
  };

  const makeAccount = (id = 'account-1', balance = 1000) => ({
    id,
    name: `${id} name`,
    type: AccountType.CASH,
    balance: new Prisma.Decimal(balance),
    maintainingBalance: null,
    providerId: null,
    userId,
    createdAt,
    updatedAt: createdAt,
  });

  const makeScheduledTransaction = (
    overrides: Partial<ScheduledTransaction> = {},
  ): ScheduledTransaction => ({
    id: scheduledTransactionId,
    type: TransactionType.EXPENSE,
    amount: new Prisma.Decimal(250),
    description: null,
    frequency: RecurringFrequency.MONTHLY,
    nextDueDate: new Date('2026-04-15T12:00:00.000Z'),
    accountId: 'account-1',
    categoryId: 'category-1',
    totalInstallments: null,
    completedInstallments: 0,
    status: ScheduledTransactionStatus.ACTIVE,
    notifyDaysBefore: null,
    userId,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  });

  const makeScheduledTransactionWithRelations = (
    overrides: Partial<
      ScheduledTransaction & {
        account: ReturnType<typeof makeAccount>;
        category: { id: string; name: string };
      }
    > = {},
  ) => ({
    ...makeScheduledTransaction(overrides),
    account:
      overrides.account ??
      makeAccount(overrides.accountId ?? 'account-1', 1000),
    category: overrides.category ?? { id: 'category-1', name: 'Bills' },
  });

  const createDto = (): CreateScheduledTransactionDto => ({
    type: TransactionType.EXPENSE,
    amount: 250,
    frequency: RecurringFrequency.MONTHLY,
    nextDueDate: '2026-04-15',
    accountId: 'account-1',
    categoryId: 'category-1',
  });

  beforeEach(async () => {
    tx = {
      scheduledTransaction: {
        findFirst: jest.fn().mockResolvedValue(makeScheduledTransaction()),
        findUnique: jest.fn().mockResolvedValue(makeScheduledTransaction()),
        update: jest.fn().mockResolvedValue(makeScheduledTransaction()),
      },
      transaction: {
        update: jest.fn().mockResolvedValue({ id: 'transaction-1' }),
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
      account: {
        findFirst: jest.fn().mockResolvedValue({ id: 'account-1' }),
      },
      category: {
        findFirst: jest.fn().mockResolvedValue({ id: 'category-1' }),
      },
      scheduledTransaction: {
        create: jest
          .fn()
          .mockResolvedValue(makeScheduledTransactionWithRelations()),
        findFirst: jest
          .fn()
          .mockResolvedValue(makeScheduledTransactionWithRelations()),
        findMany: jest.fn().mockResolvedValue([makeScheduledTransaction()]),
        update: jest
          .fn()
          .mockResolvedValue(makeScheduledTransactionWithRelations()),
        delete: jest.fn().mockResolvedValue(undefined),
      },
      transaction: tx.transaction,
    };

    transactionsService = {
      createWithTx: jest.fn().mockResolvedValue({ id: 'transaction-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledTransactionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TransactionsService, useValue: transactionsService },
      ],
    }).compile();

    service = module.get(ScheduledTransactionsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('rejects create when the account is not owned by the user', async () => {
    prisma.account.findFirst.mockResolvedValueOnce(null);

    await expect(service.create(createDto(), userId)).rejects.toThrow(
      new NotFoundException('Account account-1 not found'),
    );

    expect(prisma.category.findFirst).not.toHaveBeenCalled();
    expect(prisma.scheduledTransaction.create).not.toHaveBeenCalled();
  });

  it('rejects create when the category is not accessible to the user', async () => {
    prisma.category.findFirst.mockResolvedValueOnce(null);

    await expect(service.create(createDto(), userId)).rejects.toThrow(
      new NotFoundException('Category category-1 not found'),
    );

    expect(prisma.scheduledTransaction.create).not.toHaveBeenCalled();
  });

  it('creates a scheduled transaction when account and category are valid', async () => {
    const result = await service.create(createDto(), userId);
    const createCalls = prisma.scheduledTransaction.create.mock.calls as Array<
      [
        {
          data: {
            type: TransactionType;
            amount: number;
            description?: string;
            frequency: RecurringFrequency;
            nextDueDate: Date;
            accountId: string;
            categoryId: string;
            totalInstallments: number | null;
            completedInstallments: number;
            notifyDaysBefore?: number;
            userId: string;
          };
          include: object;
        },
      ]
    >;
    const createCall = createCalls[0][0];

    expect(prisma.account.findFirst).toHaveBeenCalledWith({
      where: { id: 'account-1', userId },
      select: { id: true },
    });
    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: { id: 'category-1', OR: [{ userId }, { isSystem: true }] },
      select: { id: true },
    });
    expect(createCall.data).toEqual({
      type: TransactionType.EXPENSE,
      amount: 250,
      description: undefined,
      frequency: RecurringFrequency.MONTHLY,
      nextDueDate: new Date('2026-04-15T12:00:00.000Z'),
      accountId: 'account-1',
      categoryId: 'category-1',
      totalInstallments: null,
      completedInstallments: 0,
      notifyDaysBefore: undefined,
      userId,
    });
    expect(createCall.include).toBeDefined();
    expect(result.amount).toBe(250);
    expect(result.account.balance).toBe(1000);
  });

  it('rejects update when the next account is not owned by the user', async () => {
    prisma.account.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.update(
        scheduledTransactionId,
        { accountId: 'account-2' } as UpdateScheduledTransactionDto,
        userId,
      ),
    ).rejects.toThrow(new NotFoundException('Account account-2 not found'));

    expect(prisma.scheduledTransaction.update).not.toHaveBeenCalled();
  });

  it('skips ownership lookups when update keeps the same account and category', async () => {
    await service.update(
      scheduledTransactionId,
      {
        accountId: 'account-1',
        categoryId: 'category-1',
        description: 'unchanged ownership refs',
      },
      userId,
    );

    expect(prisma.account.findFirst).not.toHaveBeenCalled();
    expect(prisma.category.findFirst).not.toHaveBeenCalled();
    expect(prisma.scheduledTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: scheduledTransactionId },
        data: {
          accountId: 'account-1',
          categoryId: 'category-1',
          description: 'unchanged ownership refs',
        },
      }),
    );
  });

  it('generates a monthly scheduled transaction and advances the next due date', async () => {
    tx.scheduledTransaction.findFirst.mockResolvedValueOnce(
      makeScheduledTransaction({
        frequency: RecurringFrequency.MONTHLY,
        nextDueDate: new Date('2026-04-15T12:00:00.000Z'),
      }),
    );

    await service.generate(scheduledTransactionId, userId);
    const createWithTxCalls = transactionsService.createWithTx.mock
      .calls as Array<
      [
        typeof tx,
        {
          type: TransactionType;
          amount: number;
          accountId: string;
          categoryId: string;
          date: string;
        },
        string,
      ]
    >;
    const createWithTxCall = createWithTxCalls[0];

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(createWithTxCall[0]).toBe(tx);
    expect(createWithTxCall[1]).toMatchObject({
      type: TransactionType.EXPENSE,
      amount: 250,
      accountId: 'account-1',
      categoryId: 'category-1',
    });
    expect(typeof createWithTxCall[1].date).toBe('string');
    expect(createWithTxCall[2]).toBe(userId);
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: 'transaction-1' },
      data: { scheduledTransactionId },
    });
    expect(tx.scheduledTransaction.update).toHaveBeenCalledWith({
      where: { id: scheduledTransactionId },
      data: {
        nextDueDate: new Date('2026-05-15T12:00:00.000Z'),
      },
    });
  });

  it('marks one-time schedules as completed when they are generated', async () => {
    tx.scheduledTransaction.findFirst.mockResolvedValueOnce(
      makeScheduledTransaction({
        frequency: RecurringFrequency.ONCE,
        totalInstallments: 1,
      }),
    );

    await service.generate(scheduledTransactionId, userId);

    expect(tx.scheduledTransaction.update).toHaveBeenCalledWith({
      where: { id: scheduledTransactionId },
      data: {
        completedInstallments: 1,
        status: ScheduledTransactionStatus.COMPLETED,
      },
    });
  });

  it('finds only due scheduled transactions for cron processing', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-14T09:00:00.000Z'));
    prisma.scheduledTransaction.findMany.mockResolvedValueOnce([
      makeScheduledTransaction({
        nextDueDate: new Date('2026-04-14T12:00:00.000Z'),
      }),
    ]);

    const result = await service.findAllDue();

    expect(prisma.scheduledTransaction.findMany).toHaveBeenCalledWith({
      where: {
        nextDueDate: { lte: endOfLocalDay(new Date()) },
        status: ScheduledTransactionStatus.ACTIVE,
        userId: { not: null },
      },
      orderBy: { nextDueDate: 'asc' },
    });
    expect(result).toEqual([
      expect.objectContaining({
        id: scheduledTransactionId,
        amount: 250,
      }),
    ]);
  });

  it('returns true when cron generation commits successfully for a due record', async () => {
    const dueRecord = makeScheduledTransaction({
      nextDueDate: new Date('2026-04-09T12:00:00.000Z'),
    });

    tx.scheduledTransaction.findUnique.mockResolvedValueOnce(dueRecord);

    await expect(service.generateFromRecord(dueRecord)).resolves.toBe(true);

    expect(transactionsService.createWithTx).toHaveBeenCalledTimes(1);
    expect(prisma.transaction.update).toHaveBeenCalledTimes(1);
    expect(tx.scheduledTransaction.update).toHaveBeenCalledTimes(1);
  });

  it('skips cron generation when the re-read scheduled transaction is no longer due', async () => {
    tx.scheduledTransaction.findUnique.mockResolvedValueOnce(
      makeScheduledTransaction({
        nextDueDate: new Date('2999-04-15T12:00:00.000Z'),
      }),
    );

    await expect(
      service.generateFromRecord(makeScheduledTransaction()),
    ).resolves.toBe(false);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transactionsService.createWithTx).not.toHaveBeenCalled();
    expect(prisma.transaction.update).not.toHaveBeenCalled();
    expect(tx.scheduledTransaction.update).not.toHaveBeenCalled();
  });
});
