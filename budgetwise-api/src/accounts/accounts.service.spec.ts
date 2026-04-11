import { BadRequestException } from '@nestjs/common';
import { Prisma, TransactionType, AccountType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';

describe('AccountsService create', () => {
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
    account: typeof tx.account;
  };
  let transactionsService: {
    createWithTx: jest.Mock;
  };

  const makeAccountRecord = (balance: number) => ({
    id: 'account-1',
    name: 'Wallet',
    type: AccountType.CASH,
    balance: new Prisma.Decimal(balance),
    maintainingBalance: null,
    providerId: null,
    userId,
    createdAt,
    updatedAt: createdAt,
  });

  const createDto = (balance?: number): CreateAccountDto => ({
    name: 'Wallet',
    type: AccountType.CASH,
    balance,
  });

  beforeEach(() => {
    tx = {
      account: {
        create: jest.fn().mockResolvedValue(makeAccountRecord(0)),
        findFirst: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(makeAccountRecord(0)),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
      category: {
        findFirst: jest.fn().mockResolvedValue({ id: 'adjustment-category' }),
      },
      transaction: {
        create: jest.fn(),
      },
    };

    prisma = {
      $transaction: jest
        .fn()
        .mockImplementation(
          (callback: (transactionClient: typeof tx) => Promise<unknown>) =>
            callback(tx),
        ),
      account: tx.account,
    };

    transactionsService = {
      createWithTx: jest.fn().mockResolvedValue({ id: 'transaction-1' }),
    };

    service = new AccountsService(
      prisma as unknown as PrismaService,
      transactionsService as unknown as TransactionsService,
    );
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

  it('creates a positive opening-balance income transaction', async () => {
    tx.account.findUnique.mockResolvedValueOnce(makeAccountRecord(1250.5));

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

  it('creates a negative opening-balance expense transaction', async () => {
    tx.account.findUnique.mockResolvedValueOnce(makeAccountRecord(-750));

    const result = await service.create(createDto(-750), userId);

    expect(transactionsService.createWithTx).toHaveBeenCalledWith(
      tx,
      {
        type: TransactionType.EXPENSE,
        amount: 750,
        description: 'Wallet opening balance',
        accountId: 'account-1',
        categoryId: 'adjustment-category',
      },
      userId,
    );
    expect(result.balance).toBe(-750);
  });

  it('preserves provider and maintaining balance metadata on create', async () => {
    await service.create(
      {
        name: 'Bank',
        type: AccountType.BANK,
        balance: 0,
        providerId: 'bdo',
        maintainingBalance: 5000,
      },
      userId,
    );

    expect(tx.account.create).toHaveBeenCalledWith({
      data: {
        name: 'Bank',
        type: AccountType.BANK,
        balance: 0,
        maintainingBalance: 5000,
        providerId: 'bdo',
        userId,
      },
    });
  });

  it('fails cleanly when the adjustment category is missing', async () => {
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
