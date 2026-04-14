import { Test, TestingModule } from '@nestjs/testing';
import { AccountType, Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

describe('TransactionsService', () => {
  const userId = 'user-1';
  const createdAt = new Date('2026-04-11T00:00:00.000Z');

  let service: TransactionsService;
  let tx: {
    account: {
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    category: {
      findFirst: jest.Mock;
    };
    transaction: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    goalContribution: {
      findUnique: jest.Mock;
    };
  };
  let prisma: {
    $transaction: jest.Mock;
  };

  const makeAccount = (id: string, balance: number) => ({
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

  const makeTransactionRecord = (
    overrides: {
      id?: string;
      type?: TransactionType;
      amount?: number;
      description?: string | null;
      date?: Date;
      accountId?: string | null;
      fromAccountId?: string | null;
      toAccountId?: string | null;
      categoryId?: string | null;
      account?: ReturnType<typeof makeAccount> | null;
      fromAccount?: ReturnType<typeof makeAccount> | null;
      toAccount?: ReturnType<typeof makeAccount> | null;
    } = {},
  ) => ({
    id: overrides.id ?? 'transaction-1',
    type: overrides.type ?? TransactionType.INCOME,
    amount: new Prisma.Decimal(overrides.amount ?? 100),
    description: overrides.description ?? 'Seeded transaction',
    date: overrides.date ?? new Date('2026-04-14T12:00:00.000Z'),
    accountId:
      overrides.accountId === undefined ? 'account-1' : overrides.accountId,
    fromAccountId:
      overrides.fromAccountId === undefined ? null : overrides.fromAccountId,
    toAccountId:
      overrides.toAccountId === undefined ? null : overrides.toAccountId,
    categoryId:
      overrides.categoryId === undefined ? 'category-1' : overrides.categoryId,
    userId,
    createdAt,
    updatedAt: createdAt,
    account:
      overrides.account === undefined
        ? makeAccount('account-1', 1000)
        : overrides.account,
    fromAccount:
      overrides.fromAccount === undefined ? null : overrides.fromAccount,
    toAccount: overrides.toAccount === undefined ? null : overrides.toAccount,
    category: { id: 'category-1', name: 'General' },
  });

  beforeEach(async () => {
    tx = {
      account: {
        findFirst: jest.fn().mockResolvedValue({ id: 'account-1' }),
        update: jest.fn().mockResolvedValue({ id: 'account-1' }),
      },
      category: {
        findFirst: jest.fn().mockResolvedValue({ id: 'category-1' }),
      },
      transaction: {
        create: jest.fn().mockResolvedValue(makeTransactionRecord()),
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue(makeTransactionRecord()),
        delete: jest.fn().mockResolvedValue(makeTransactionRecord()),
      },
      goalContribution: {
        findUnique: jest.fn().mockResolvedValue(null),
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
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(TransactionsService);
  });

  it('creates an income transaction and increases the account balance', async () => {
    const dto: CreateTransactionDto = {
      type: TransactionType.INCOME,
      amount: 500,
      accountId: 'account-1',
      categoryId: 'category-1',
    };
    tx.transaction.create.mockResolvedValueOnce(
      makeTransactionRecord({
        type: TransactionType.INCOME,
        amount: 500,
      }),
    );

    const result = await service.create(dto, userId);
    const createCalls = tx.transaction.create.mock.calls as Array<
      [
        {
          data: {
            type: TransactionType;
            amount: number;
            description?: string;
            date: Date;
            accountId: string | null;
            fromAccountId: string | null;
            toAccountId: string | null;
            categoryId: string | null;
            userId: string;
          };
          include: object;
        },
      ]
    >;
    const createCall = createCalls[0][0];

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(createCall.data).toMatchObject({
      type: TransactionType.INCOME,
      amount: 500,
      description: undefined,
      accountId: 'account-1',
      fromAccountId: null,
      toAccountId: null,
      categoryId: 'category-1',
      userId,
    });
    expect(createCall.data.date).toBeInstanceOf(Date);
    expect(createCall.include).toBeDefined();
    expect(tx.account.update).toHaveBeenCalledWith({
      where: { id: 'account-1' },
      data: { balance: { increment: 500 } },
    });
    expect(result.amount).toBe(500);
  });

  it('creates an expense transaction and decreases the account balance', async () => {
    await service.create(
      {
        type: TransactionType.EXPENSE,
        amount: 125.75,
        accountId: 'account-1',
        categoryId: 'category-1',
      },
      userId,
    );

    expect(tx.account.update).toHaveBeenCalledWith({
      where: { id: 'account-1' },
      data: { balance: { increment: -125.75 } },
    });
  });

  it('creates a transfer and applies the balance effect to both accounts', async () => {
    tx.transaction.create.mockResolvedValueOnce(
      makeTransactionRecord({
        type: TransactionType.TRANSFER,
        amount: 300,
        accountId: null,
        fromAccountId: 'from-account',
        toAccountId: 'to-account',
        categoryId: null,
        account: null,
        fromAccount: makeAccount('from-account', 700),
        toAccount: makeAccount('to-account', 1300),
      }),
    );

    await service.create(
      {
        type: TransactionType.TRANSFER,
        amount: 300,
        fromAccountId: 'from-account',
        toAccountId: 'to-account',
      },
      userId,
    );
    const createCalls = tx.transaction.create.mock.calls as Array<
      [
        {
          data: {
            type: TransactionType;
            amount: number;
            description?: string;
            date: Date;
            accountId: string | null;
            fromAccountId: string | null;
            toAccountId: string | null;
            categoryId: string | null;
            userId: string;
          };
          include: object;
        },
      ]
    >;
    const createCall = createCalls[0][0];

    expect(tx.category.findFirst).not.toHaveBeenCalled();
    expect(createCall.data).toMatchObject({
      type: TransactionType.TRANSFER,
      amount: 300,
      description: undefined,
      accountId: null,
      fromAccountId: 'from-account',
      toAccountId: 'to-account',
      categoryId: null,
      userId,
    });
    expect(createCall.data.date).toBeInstanceOf(Date);
    expect(createCall.include).toBeDefined();
    expect(tx.account.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'from-account' },
      data: { balance: { increment: -300 } },
    });
    expect(tx.account.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'to-account' },
      data: { balance: { increment: 300 } },
    });
  });

  it('updates an existing transaction by reversing the old amount and applying the new amount', async () => {
    tx.transaction.findFirst.mockResolvedValueOnce({
      id: 'transaction-1',
      type: TransactionType.EXPENSE,
      amount: new Prisma.Decimal(100),
      description: 'Groceries',
      date: new Date('2026-04-14T12:00:00.000Z'),
      accountId: 'account-1',
      fromAccountId: null,
      toAccountId: null,
      categoryId: 'category-1',
      userId,
      createdAt,
      updatedAt: createdAt,
    });
    tx.transaction.update.mockResolvedValueOnce(
      makeTransactionRecord({
        type: TransactionType.EXPENSE,
        amount: 150,
      }),
    );

    await service.update('transaction-1', { amount: 150 }, userId);
    const updateCalls = tx.transaction.update.mock.calls as Array<
      [
        {
          where: { id: string };
          data: {
            type: TransactionType;
            amount: number;
            description: string | null;
            date: Date;
            accountId: string | null;
            fromAccountId: string | null;
            toAccountId: string | null;
            categoryId: string | null;
          };
          include: object;
        },
      ]
    >;
    const updateCall = updateCalls[0][0];

    expect(tx.account.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'account-1' },
      data: { balance: { increment: 100 } },
    });
    expect(updateCall.where).toEqual({ id: 'transaction-1' });
    expect(updateCall.data).toEqual({
      type: TransactionType.EXPENSE,
      amount: 150,
      description: 'Groceries',
      date: new Date('2026-04-14T12:00:00.000Z'),
      accountId: 'account-1',
      fromAccountId: null,
      toAccountId: null,
      categoryId: 'category-1',
    });
    expect(updateCall.include).toBeDefined();
    expect(tx.account.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'account-1' },
      data: { balance: { increment: -150 } },
    });
  });

  it('deletes a transaction and reverses its balance effect', async () => {
    tx.transaction.findFirst.mockResolvedValueOnce({
      id: 'transaction-1',
      type: TransactionType.INCOME,
      amount: new Prisma.Decimal(120),
      description: 'Payday',
      date: new Date('2026-04-14T12:00:00.000Z'),
      accountId: 'account-1',
      fromAccountId: null,
      toAccountId: null,
      categoryId: 'category-1',
      userId,
      createdAt,
      updatedAt: createdAt,
    });
    tx.transaction.delete.mockResolvedValueOnce(
      makeTransactionRecord({ type: TransactionType.INCOME, amount: 120 }),
    );

    const result = await service.remove('transaction-1', userId);
    const deleteCalls = tx.transaction.delete.mock.calls as Array<
      [
        {
          where: { id: string };
          include: object;
        },
      ]
    >;
    const deleteCall = deleteCalls[0][0];

    expect(tx.account.update).toHaveBeenCalledWith({
      where: { id: 'account-1' },
      data: { balance: { increment: -120 } },
    });
    expect(deleteCall.where).toEqual({ id: 'transaction-1' });
    expect(deleteCall.include).toBeDefined();
    expect(result.amount).toBe(120);
  });

  it('keeps balance updates inside the prisma transaction when creation fails', async () => {
    tx.transaction.create.mockRejectedValueOnce(
      new Error('database unavailable'),
    );

    await expect(
      service.create(
        {
          type: TransactionType.INCOME,
          amount: 500,
          accountId: 'account-1',
          categoryId: 'category-1',
        },
        userId,
      ),
    ).rejects.toThrow('database unavailable');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.account.update).not.toHaveBeenCalled();
  });
});
