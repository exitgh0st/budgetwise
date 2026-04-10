import { NotFoundException } from '@nestjs/common';
import {
  Prisma,
  RecurringFrequency,
  ScheduledTransaction,
  ScheduledTransactionStatus,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateScheduledTransactionDto } from './dto/create-scheduled-transaction.dto';
import { UpdateScheduledTransactionDto } from './dto/update-scheduled-transaction.dto';
import { ScheduledTransactionsService } from './scheduled-transactions.service';

describe('ScheduledTransactionsService ownership validation', () => {
  const userId = 'user-1';
  const scheduledTransactionId = 'scheduled-1';

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
    transaction: { update: jest.Mock };
    scheduledTransaction: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let transactionsService: {
    createWithTx: jest.Mock;
  };

  const createDto = (): CreateScheduledTransactionDto => ({
    type: TransactionType.EXPENSE,
    amount: 250,
    frequency: RecurringFrequency.MONTHLY,
    nextDueDate: '2026-04-15',
    accountId: 'account-1',
    categoryId: 'category-1',
  });

  const scheduledTransactionRecord = (
    overrides: Partial<ScheduledTransaction> = {},
  ): ScheduledTransaction => ({
    id: scheduledTransactionId,
    type: TransactionType.EXPENSE,
    amount: new Prisma.Decimal(250),
    description: null,
    frequency: RecurringFrequency.MONTHLY,
    nextDueDate: new Date('2026-04-15T00:00:00.000Z'),
    accountId: 'account-1',
    categoryId: 'category-1',
    totalInstallments: null,
    completedInstallments: 0,
    status: ScheduledTransactionStatus.ACTIVE,
    notifyDaysBefore: null,
    userId,
    createdAt: new Date('2026-04-10T00:00:00.000Z'),
    updatedAt: new Date('2026-04-10T00:00:00.000Z'),
    ...overrides,
  });

  beforeEach(() => {
    tx = {
      scheduledTransaction: {
        findFirst: jest.fn().mockResolvedValue(scheduledTransactionRecord()),
        findUnique: jest.fn().mockResolvedValue(scheduledTransactionRecord()),
        update: jest.fn().mockResolvedValue(scheduledTransactionRecord()),
      },
      transaction: {
        update: jest.fn().mockResolvedValue({ id: 'transaction-1' }),
      },
    };

    prisma = {
      $transaction: jest
        .fn()
        .mockImplementation(
          (callback: (transactionClient: typeof tx) => Promise<unknown>) =>
            callback(tx),
        ),
      account: {
        findFirst: jest.fn().mockResolvedValue({ id: 'account-1' }),
      },
      category: {
        findFirst: jest.fn().mockResolvedValue({ id: 'category-1' }),
      },
      transaction: tx.transaction,
      scheduledTransaction: {
        create: jest.fn().mockResolvedValue(scheduledTransactionRecord()),
        findFirst: tx.scheduledTransaction.findFirst,
        findUnique: tx.scheduledTransaction.findUnique,
        update: tx.scheduledTransaction.update,
      },
    };

    transactionsService = {
      createWithTx: jest.fn().mockResolvedValue({ id: 'transaction-1' }),
    };

    service = new ScheduledTransactionsService(
      prisma as unknown as PrismaService,
      transactionsService as unknown as TransactionsService,
    );
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
    await service.create(createDto(), userId);

    expect(prisma.account.findFirst).toHaveBeenCalledWith({
      where: { id: 'account-1', userId },
      select: { id: true },
    });
    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: { id: 'category-1', OR: [{ userId }, { isSystem: true }] },
      select: { id: true },
    });
    expect(prisma.scheduledTransaction.create).toHaveBeenCalled();
  });

  it('allows create when the category is a shared system category', async () => {
    prisma.category.findFirst.mockResolvedValueOnce({
      id: 'system-category-1',
    });

    await service.create(
      { ...createDto(), categoryId: 'system-category-1' },
      userId,
    );

    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'system-category-1',
        OR: [{ userId }, { isSystem: true }],
      },
      select: { id: true },
    });
    expect(prisma.scheduledTransaction.create).toHaveBeenCalled();
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

  it('generates manually inside a single prisma transaction', async () => {
    await service.generate(scheduledTransactionId, userId);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.scheduledTransaction.findFirst).toHaveBeenCalledWith({
      where: { id: scheduledTransactionId, userId },
    });
    expect(transactionsService.createWithTx).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        type: TransactionType.EXPENSE,
        amount: 250,
        accountId: 'account-1',
        categoryId: 'category-1',
      }),
      userId,
    );
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: 'transaction-1' },
      data: { scheduledTransactionId },
    });
    const scheduleUpdateCall = prisma.scheduledTransaction.update.mock
      .calls[0] as [{ where: { id: string }; data: { nextDueDate?: Date } }];

    expect(scheduleUpdateCall[0].where).toEqual({ id: scheduledTransactionId });
    expect(scheduleUpdateCall[0].data.nextDueDate).toBeInstanceOf(Date);
  });

  it('returns true when cron generation commits successfully', async () => {
    const dueRecord = scheduledTransactionRecord({
      nextDueDate: new Date('2026-04-09T12:00:00.000Z'),
    });

    prisma.scheduledTransaction.findUnique.mockResolvedValueOnce(dueRecord);

    await expect(service.generateFromRecord(dueRecord)).resolves.toBe(true);

    expect(transactionsService.createWithTx).toHaveBeenCalledTimes(1);
    expect(prisma.transaction.update).toHaveBeenCalledTimes(1);
    expect(prisma.scheduledTransaction.update).toHaveBeenCalledTimes(1);
  });

  it('returns false when cron generation is skipped after the in-transaction reread', async () => {
    prisma.scheduledTransaction.findUnique.mockResolvedValueOnce(
      scheduledTransactionRecord({
        nextDueDate: new Date('2999-04-15T12:00:00.000Z'),
      }),
    );

    await expect(
      service.generateFromRecord(scheduledTransactionRecord()),
    ).resolves.toBe(false);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transactionsService.createWithTx).not.toHaveBeenCalled();
    expect(prisma.transaction.update).not.toHaveBeenCalled();
    expect(prisma.scheduledTransaction.update).not.toHaveBeenCalled();
  });
});
