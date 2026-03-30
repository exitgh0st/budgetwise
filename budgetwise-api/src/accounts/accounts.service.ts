import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Account } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAccountDto): Promise<Account> {
    return this.prisma.account.create({
      data: {
        name: dto.name,
        type: dto.type,
        balance: dto.balance ?? 0,
      },
    });
  }

  async findAll(): Promise<Account[]> {
    return this.prisma.account.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    return account;
  }

  async update(id: string, dto: UpdateAccountDto): Promise<Account> {
    await this.findOne(id);
    return this.prisma.account.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<Account> {
    await this.findOne(id);
    return this.prisma.account.delete({ where: { id } });
  }

  async adjustBalance(id: string, newBalance: number): Promise<Account> {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id } });
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
        },
      });

      return tx.account.update({
        where: { id },
        data: { balance: newBalance },
      });
    });
  }
}
