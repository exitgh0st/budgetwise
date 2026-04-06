import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Bill, RecurringFrequency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';

@Injectable()
export class BillsService {
  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
  ) {}

  async create(dto: CreateBillDto, userId: string): Promise<Bill> {
    const totalInstallments = dto.frequency === 'ONCE'
      ? 1
      : (dto.totalInstallments ?? null);

    return this.prisma.bill.create({
      data: {
        type: dto.type,
        amount: dto.amount,
        description: dto.description,
        frequency: dto.frequency,
        nextDueDate: new Date(dto.nextDueDate),
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        totalInstallments,
        userId,
      },
      include: { account: true, category: true },
    });
  }

  async findAll(userId: string, status?: Bill['status']): Promise<Bill[]> {
    return this.prisma.bill.findMany({
      where: {
        userId,
        ...(status !== undefined && { status }),
      },
      include: { account: true, category: true },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Bill> {
    const item = await this.prisma.bill.findFirst({
      where: { id, userId },
      include: { account: true, category: true },
    });
    if (!item) throw new NotFoundException(`Bill ${id} not found`);
    return item;
  }

  async update(id: string, dto: UpdateBillDto, userId: string): Promise<Bill> {
    await this.findOne(id, userId);
    return this.prisma.bill.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
        ...(dto.nextDueDate !== undefined && { nextDueDate: new Date(dto.nextDueDate) }),
        ...(dto.accountId !== undefined && { accountId: dto.accountId }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.totalInstallments !== undefined && { totalInstallments: dto.totalInstallments }),
      },
      include: { account: true, category: true },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.prisma.bill.delete({ where: { id } });
  }

  async generate(id: string, userId: string): Promise<object> {
    const bill = await this.findOne(id, userId);

    if (bill.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot generate from a non-active bill');
    }

    const transaction = await this.transactionsService.create({
      type: bill.type,
      amount: Number(bill.amount),
      description: bill.description ?? undefined,
      accountId: bill.accountId,
      categoryId: bill.categoryId,
      date: bill.nextDueDate.toISOString(),
    }, userId);

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { billId: bill.id },
    });

    const newCompleted = bill.completedInstallments + 1;
    const isComplete = bill.frequency === 'ONCE'
      || (bill.totalInstallments !== null && newCompleted >= bill.totalInstallments);

    if (isComplete) {
      await this.prisma.bill.update({
        where: { id },
        data: {
          completedInstallments: newCompleted,
          status: 'COMPLETED',
        },
      });
    } else {
      const next = this.advanceDate(bill.nextDueDate, bill.frequency);
      await this.prisma.bill.update({
        where: { id },
        data: {
          completedInstallments: newCompleted,
          nextDueDate: next,
        },
      });
    }

    return transaction;
  }

  async findAllDue(): Promise<Bill[]> {
    return this.prisma.bill.findMany({
      where: {
        nextDueDate: { lte: new Date() },
        status: 'ACTIVE',
        userId: { not: null },
      },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async generateFromRecord(bill: Bill): Promise<void> {
    const userId = bill.userId;
    if (!userId) return;

    const transaction = await this.transactionsService.create({
      type: bill.type,
      amount: Number(bill.amount),
      description: bill.description ?? undefined,
      accountId: bill.accountId,
      categoryId: bill.categoryId,
      date: bill.nextDueDate.toISOString(),
    }, userId);

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { billId: bill.id },
    });

    const newCompleted = bill.completedInstallments + 1;
    const isComplete = bill.frequency === 'ONCE'
      || (bill.totalInstallments !== null && newCompleted >= bill.totalInstallments);

    if (isComplete) {
      await this.prisma.bill.update({
        where: { id: bill.id },
        data: { completedInstallments: newCompleted, status: 'COMPLETED' },
      });
    } else {
      const next = this.advanceDate(bill.nextDueDate, bill.frequency);
      await this.prisma.bill.update({
        where: { id: bill.id },
        data: { completedInstallments: newCompleted, nextDueDate: next },
      });
    }
  }

  private advanceDate(from: Date, frequency: RecurringFrequency): Date {
    const originalDay = from.getDate();
    const month = from.getMonth();
    const year = from.getFullYear();

    switch (frequency) {
      case 'ONCE':
        return new Date(from);

      case 'WEEKLY':
        return new Date(year, month, originalDay + 7);

      case 'MONTHLY': {
        const nextMonth = month + 1;
        const nextYear = year + Math.floor(nextMonth / 12);
        const normalizedMonth = nextMonth % 12;
        const lastDay = new Date(nextYear, normalizedMonth + 1, 0).getDate();
        return new Date(nextYear, normalizedMonth, Math.min(originalDay, lastDay));
      }

      case 'YEARLY': {
        const nextYear = year + 1;
        const lastDay = new Date(nextYear, month + 1, 0).getDate();
        return new Date(nextYear, month, Math.min(originalDay, lastDay));
      }

      default:
        return new Date(from);
    }
  }
}
