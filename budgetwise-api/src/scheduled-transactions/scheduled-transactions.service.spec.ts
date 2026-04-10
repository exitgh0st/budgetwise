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
  let prisma: {
    account: { findFirst: jest.Mock };
    category: { findFirst: jest.Mock };
    scheduledTransaction: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
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
    prisma = {
      account: {
        findFirst: jest.fn().mockResolvedValue({ id: 'account-1' }),
      },
      category: {
        findFirst: jest.fn().mockResolvedValue({ id: 'category-1' }),
      },
      scheduledTransaction: {
        create: jest.fn().mockResolvedValue(scheduledTransactionRecord()),
        findFirst: jest.fn().mockResolvedValue(scheduledTransactionRecord()),
        update: jest.fn().mockResolvedValue(scheduledTransactionRecord()),
      },
    };

    service = new ScheduledTransactionsService(
      prisma as unknown as PrismaService,
      {} as TransactionsService,
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
});
