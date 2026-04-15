import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountType, Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReportCacheService } from '../reports/report-cache.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';

describe('AccountsService', () => {
  const userId = 'user-1';
  const createdAt = new Date('2026-04-11T00:00:00.000Z');

  let service: AccountsService;
  let tx: {
    account: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findMany: jest.Mock;
    };
    category: { findFirst: jest.Mock };
    transaction: { create: jest.Mock };
  };
  let prisma: {
    $transaction: jest.Mock;
    account: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let transactionsService: {
    createWithTx: jest.Mock;
  };
  let reportCache: {
    invalidateUser: jest.Mock;
  };

  const makeAccountRecord = (
    overrides: {
      id?: string;
      name?: string;
      type?: AccountType;
      balance?: number;
      maintainingBalance?: number | null;
      providerId?: string | null;
      userId?: string;
    } = {},
  ) => ({
    id: overrides.id ?? 'account-1',
    name: overrides.name ?? 'Wallet',
    type: overrides.type ?? AccountType.CASH,
    balance: new Prisma.Decimal(overrides.balance ?? 0),
    maintainingBalance:
      overrides.maintainingBalance === undefined ||
      overrides.maintainingBalance === null
        ? null
        : new Prisma.Decimal(overrides.maintainingBalance),
    providerId: overrides.providerId ?? null,
    userId: overrides.userId ?? userId,
    createdAt,
    updatedAt: createdAt,
  });

  const createDto = (balance?: number): CreateAccountDto => ({
    name: 'Wallet',
    type: AccountType.CASH,
    balance,
  });

  beforeEach(async () => {
    tx = {
      account: {
        create: jest.fn().mockResolvedValue(makeAccountRecord()),
        findFirst: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(makeAccountRecord()),
        update: jest.fn().mockResolvedValue(makeAccountRecord()),
        delete: jest.fn().mockResolvedValue(makeAccountRecord()),
        findMany: jest.fn(),
      },
      category: {
        findFirst: jest.fn().mockResolvedValue({ id: 'adjustment-category' }),
      },
      transaction: {
        create: jest.fn().mockResolvedValue({ id: 'transaction-1' }),
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
        create: tx.account.create,
        findFirst: jest.fn().mockResolvedValue(makeAccountRecord()),
        findUnique: tx.account.findUnique,
        update: jest.fn().mockResolvedValue(makeAccountRecord()),
        delete: jest.fn().mockResolvedValue(makeAccountRecord()),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    transactionsService = {
      createWithTx: jest.fn().mockResolvedValue({ id: 'transaction-1' }),
    };
    reportCache = {
      invalidateUser: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TransactionsService, useValue: transactionsService },
        { provide: ReportCacheService, useValue: reportCache },
      ],
    }).compile();

    service = module.get(AccountsService);
  });

  it('creates a zero-balance account without an opening transaction', async () => {
    const result = await service.create(createDto(0), userId);

    expect(tx.account.create).toHaveBeenCalledWith({
      data: {
        name: 'Wallet',
        type: AccountType.CASH,
        balance: 0,
        maintainingBalance: null,
        providerId: null,
        userId,
      },
    });
    expect(tx.category.findFirst).not.toHaveBeenCalled();
    expect(transactionsService.createWithTx).not.toHaveBeenCalled();
    expect(result.balance).toBe(0);
  });

  it('creates an opening-balance adjustment transaction when balance is non-zero', async () => {
    tx.account.findUnique.mockResolvedValueOnce(
      makeAccountRecord({ balance: 1250.5 }),
    );

    const result = await service.create(createDto(1250.5), userId);

    expect(tx.category.findFirst).toHaveBeenCalledWith({
      where: { name: 'Adjustment', isSystem: true },
      select: { id: true },
    });
    expect(transactionsService.createWithTx).toHaveBeenCalledWith(
      tx,
      {
        type: TransactionType.INCOME,
        amount: 1250.5,
        description: 'Wallet opening balance',
        accountId: 'account-1',
        categoryId: 'adjustment-category',
      },
      userId,
    );
    expect(result.balance).toBe(1250.5);
  });

  it('updates the account name without changing balance state', async () => {
    prisma.account.findFirst.mockResolvedValueOnce(makeAccountRecord());
    prisma.account.update.mockResolvedValueOnce(
      makeAccountRecord({ name: 'Emergency Fund', balance: 250 }),
    );

    const result = await service.update(
      'account-1',
      { name: 'Emergency Fund' },
      userId,
    );

    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: 'account-1' },
      data: { name: 'Emergency Fund' },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(result.name).toBe('Emergency Fund');
    expect(result.balance).toBe(250);
  });

  it('deletes an owned account', async () => {
    prisma.account.findFirst.mockResolvedValueOnce(makeAccountRecord());
    prisma.account.delete.mockResolvedValueOnce(
      makeAccountRecord({ name: 'Archived Wallet' }),
    );

    const result = await service.remove('account-1', userId);

    expect(prisma.account.delete).toHaveBeenCalledWith({
      where: { id: 'account-1' },
    });
    expect(result.name).toBe('Archived Wallet');
  });

  it('adjusts balance by recording an adjustment transaction and updating the account', async () => {
    tx.account.findFirst.mockResolvedValueOnce(
      makeAccountRecord({ balance: 100 }),
    );
    tx.account.update.mockResolvedValueOnce(
      makeAccountRecord({ balance: 150 }),
    );

    const result = await service.adjustBalance('account-1', 150, userId);

    const adjustmentCreateCalls = tx.transaction.create.mock.calls as Array<
      [
        {
          data: {
            type: string;
            amount: number;
            description: string;
            date: Date;
            accountId: string;
            categoryId: string;
            userId: string;
          };
        },
      ]
    >;
    const adjustmentCreateCall = adjustmentCreateCalls[0][0];

    expect(adjustmentCreateCall.data).toMatchObject({
      type: 'INCOME',
      amount: 50,
      description: 'Wallet adjustment',
      accountId: 'account-1',
      categoryId: 'adjustment-category',
      userId,
    });
    expect(adjustmentCreateCall.data.date).toBeInstanceOf(Date);
    expect(tx.account.update).toHaveBeenCalledWith({
      where: { id: 'account-1' },
      data: { balance: 150 },
    });
    expect(result.balance).toBe(150);
  });

  it('lists accounts scoped to the provided user id', async () => {
    prisma.account.findMany.mockResolvedValueOnce([
      makeAccountRecord({ id: 'account-1', name: 'Cash Wallet', balance: 25 }),
      makeAccountRecord({
        id: 'account-2',
        name: 'Savings',
        type: AccountType.BANK,
        balance: 4000,
        maintainingBalance: 500,
      }),
    ]);

    const result = await service.findAll(userId);

    expect(prisma.account.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 250,
    });
    expect(result).toEqual([
      expect.objectContaining({ id: 'account-1', balance: 25 }),
      expect.objectContaining({
        id: 'account-2',
        balance: 4000,
        maintainingBalance: 500,
      }),
    ]);
  });

  it('fails cleanly when the adjustment category is missing during account creation', async () => {
    tx.category.findFirst.mockResolvedValueOnce(null);

    await expect(service.create(createDto(100), userId)).rejects.toThrow(
      new BadRequestException(
        'Adjustment category not found. Please run database seed.',
      ),
    );

    expect(transactionsService.createWithTx).not.toHaveBeenCalled();
    expect(tx.account.findUnique).not.toHaveBeenCalled();
  });
});
