import { Controller, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from './current-user.decorator';
import { AccountType } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService) {}

  @Post('onboard')
  async onboard(@CurrentUser() user: { userId: string }) {
    const existingAccounts = await this.prisma.account.count({
      where: { userId: user.userId },
    });
    if (existingAccounts > 0) {
      return { status: 'already_onboarded' };
    }

    // Clone template categories (userId=null, non-system) for this user
    const templateCategories = await this.prisma.category.findMany({
      where: { userId: null, isSystem: false },
    });
    for (const cat of templateCategories) {
      await this.prisma.category.create({
        data: {
          name: cat.name,
          icon: cat.icon,
          userId: user.userId,
        },
      });
    }

    // Create starter accounts
    const starterAccounts = [
      { name: 'Cash', type: AccountType.CASH },
      { name: 'Bank Account', type: AccountType.BANK },
      { name: 'E-Wallet', type: AccountType.EWALLET },
    ];
    for (const acc of starterAccounts) {
      await this.prisma.account.create({
        data: { ...acc, userId: user.userId },
      });
    }

    return { status: 'onboarded' };
  }
}
