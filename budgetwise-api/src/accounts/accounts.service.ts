import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Account } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAccountDto, userId: string): Promise<Account> {
    return this.prisma.account.create({
      data: {
        name: dto.name,
        type: dto.type,
        balance: dto.balance ?? 0,
        userId,
      },
    });
  }

  async findAll(userId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Account> {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    return account;
  }

  async update(id: string, dto: UpdateAccountDto, userId: string): Promise<Account> {
    await this.findOne(id, userId);
    return this.prisma.account.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string): Promise<Account> {
    await this.findOne(id, userId);
    return this.prisma.account.delete({ where: { id } });
  }

  async adjustBalance(id: string, newBalance: number, userId: string): Promise<Account> {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({ where: { id, userId } });
      if (!account) throw new NotFoundException(`Account ${id} not found`);

      const currentBalance = Number(account.balance);
      const diff = newBalance - currentBalance;

      if (diff === 0) return account;

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
          isSettled: true,
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
  }
}
