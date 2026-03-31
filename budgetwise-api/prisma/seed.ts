import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // These are template categories (userId=null) cloned to each new user by the onboard endpoint
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
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, userId: null },
    });
    if (!existing) {
      await prisma.category.create({ data: { ...cat, userId: null } });
    }
  }

  // System Adjustment category — global, visible to all users
  const adjustment = await prisma.category.findFirst({
    where: { name: 'Adjustment', userId: null },
  });
  if (adjustment) {
    await prisma.category.update({
      where: { id: adjustment.id },
      data: { isSystem: true },
    });
  } else {
    await prisma.category.create({
      data: { name: 'Adjustment', icon: '⚖️', isSystem: true, userId: null },
    });
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
