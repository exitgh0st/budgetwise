-- Add ONCE to frequency enum
ALTER TYPE "RecurringFrequency" ADD VALUE 'ONCE';

-- Create BillStatus enum
CREATE TYPE "BillStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- Rename the table (preserves all data)
ALTER TABLE "RecurringTransaction" RENAME TO "Bill";

-- Rename primary key constraint
ALTER TABLE "Bill" RENAME CONSTRAINT "RecurringTransaction_pkey" TO "Bill_pkey";

-- Add new columns to Bill
ALTER TABLE "Bill" ADD COLUMN "status" "BillStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Bill" ADD COLUMN "totalInstallments" INTEGER;
ALTER TABLE "Bill" ADD COLUMN "completedInstallments" INTEGER NOT NULL DEFAULT 0;

-- Add billId FK to Transaction
ALTER TABLE "Transaction" ADD COLUMN "billId" TEXT;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_billId_fkey"
  FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop isSettled from Transaction
ALTER TABLE "Transaction" DROP COLUMN IF EXISTS "isSettled";

-- Rename existing FK constraints
ALTER TABLE "Bill" RENAME CONSTRAINT "RecurringTransaction_accountId_fkey" TO "Bill_accountId_fkey";
ALTER TABLE "Bill" RENAME CONSTRAINT "RecurringTransaction_categoryId_fkey" TO "Bill_categoryId_fkey";

-- Rename existing indexes
ALTER INDEX "RecurringTransaction_userId_idx" RENAME TO "Bill_userId_idx";
ALTER INDEX "RecurringTransaction_nextDueDate_idx" RENAME TO "Bill_nextDueDate_idx";

-- Add new indexes
CREATE INDEX "Bill_status_idx" ON "Bill"("status");
CREATE INDEX "Transaction_billId_idx" ON "Transaction"("billId");