import 'dotenv/config';
import { PrismaClient, AccountType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = [
    { name: 'Food & Dining', icon: '🍔' },
    { name: 'Transport', icon: '🚗' },
    { name: 'Bills & Utilities', icon: '💡' },
    { name: 'Shopping', icon: '🛍️' },
    { name: 'Entertainment', icon: '🎮' },
    { name: 'Health', icon: '💊' },
    { name: 'Education', icon: '📚' },
    { name: 'Savings', icon: '💰' },
    { name: 'Salary', icon: '💼' },
    { name: 'Freelance', icon: '💻' },
    { name: 'Other', icon: '📌' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // Ensure the system Adjustment category always exists with isSystem: true
  await prisma.category.upsert({
    where: { name: 'Adjustment' },
    update: { isSystem: true },
    create: { name: 'Adjustment', icon: '⚖️', isSystem: true },
  });

  const accounts = [
    { name: 'Cash', type: AccountType.CASH },
    { name: 'Bank Account', type: AccountType.BANK },
    { name: 'E-Wallet', type: AccountType.EWALLET },
  ];

  for (const acc of accounts) {
    const existing = await prisma.account.findFirst({ where: { name: acc.name } });
    if (!existing) {
      await prisma.account.create({ data: acc });
    }
  }

  console.log('Seed data loaded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
