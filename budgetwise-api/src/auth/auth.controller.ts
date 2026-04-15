import { Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from './current-user.decorator';
import { AccountType } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService) {}

  @Post('onboard')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async onboard(@CurrentUser() user: { userId: string }) {
    const existingAccounts = await this.prisma.account.count({
      where: { userId: user.userId },
    });

    if (existingAccounts > 0) {
      return { status: 'already_onboarded' };
    }

    const templateCategories = await this.prisma.category.findMany({
      where: { userId: null, isSystem: false },
    });

    const starterAccounts = [
      { name: 'Cash', type: AccountType.CASH },
      { name: 'Bank Account', type: AccountType.BANK },
      { name: 'E-Wallet', type: AccountType.EWALLET },
    ];

    await this.prisma.$transaction(async (tx) => {
      await tx.category.createMany({
        data: templateCategories.map((cat) => ({
          name: cat.name,
          icon: cat.icon,
          userId: user.userId,
        })),
      });

      await tx.account.createMany({
        data: starterAccounts.map((acc) => ({
          ...acc,
          userId: user.userId,
        })),
      });
    });

    return { status: 'onboarded' };
  }
}
