# Ticket 02 — Seed Data

**Phase:** 1 — Foundation  
**Priority:** High  
**Depends on:** Ticket 01  
**Blocks:** Nothing (but makes manual testing easier for all subsequent tickets)

---

## Objective

Create a seed script that populates the database with default categories and starter accounts so the app is immediately usable after setup.

---

## Tasks

### 1. Create Seed File

File: `prisma/seed.ts`

```typescript
import { PrismaClient, AccountType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Default categories
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

  // Default accounts
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
```

### 2. Configure Seed Command

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Install ts-node if not present:

```bash
npm install -D ts-node
```

### 3. Run the Seed

```bash
npx prisma db seed
```

---

## Acceptance Criteria

- [ ] `npx prisma db seed` runs without errors
- [ ] 11 categories exist in the database after seeding
- [ ] 3 default accounts exist (Cash, Bank Account, E-Wallet)
- [ ] Running the seed a second time does NOT create duplicates (upsert/check behavior)
- [ ] Verify via `npx prisma studio` that all records are present
