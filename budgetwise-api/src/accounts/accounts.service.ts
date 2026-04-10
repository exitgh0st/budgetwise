import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Account } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

export type AccountResponse = Omit<
  Account,
  'balance' | 'maintainingBalance'
> & {
  balance: number;
  maintainingBalance: number | null;
};

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(
    dto: CreateAccountDto,
    userId: string,
  ): Promise<AccountResponse> {
    const account = await this.prisma.account.create({
      data: {
        name: dto.name,
        type: dto.type,
        balance: dto.balance ?? 0,
        maintainingBalance: dto.maintainingBalance ?? null,
        providerId: dto.providerId ?? null,
        userId,
      },
    });

    return this.toResponse(account);
  }

  async findAll(userId: string): Promise<AccountResponse[]> {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return accounts.map((account) => this.toResponse(account));
  }

  async findOne(id: string, userId: string): Promise<AccountResponse> {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });

    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }

    return this.toResponse(account);
  }

  async update(
    id: string,
    dto: UpdateAccountDto,
    userId: string,
  ): Promise<AccountResponse> {
    await this.findOne(id, userId);

    const account = await this.prisma.account.update({
      where: { id },
      data: dto,
    });

    return this.toResponse(account);
  }

  async remove(id: string, userId: string): Promise<AccountResponse> {
    await this.findOne(id, userId);

    const account = await this.prisma.account.delete({ where: { id } });

    return this.toResponse(account);
  }

  async adjustBalance(
    id: string,
    newBalance: number,
    userId: string,
  ): Promise<AccountResponse> {
    const account = await this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({ where: { id, userId } });
      if (!account) {
        throw new NotFoundException(`Account ${id} not found`);
      }

      const currentBalance = Number(account.balance);
      const diff = newBalance - currentBalance;

      if (diff === 0) {
        return account;
      }

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

    return this.toResponse(account);
  }

  private toResponse(account: Account): AccountResponse {
    return {
      ...account,
      balance: Number(account.balance),
      maintainingBalance:
        account.maintainingBalance === null
          ? null
          : Number(account.maintainingBalance),
    };
  }
}
