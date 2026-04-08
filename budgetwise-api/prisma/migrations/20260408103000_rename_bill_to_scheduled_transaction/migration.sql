-- Rename enum in place so existing status values are preserved
ALTER TYPE "BillStatus" RENAME TO "ScheduledTransactionStatus";

-- Rename the underlying table and keep all existing rows
ALTER TABLE "Bill" RENAME TO "scheduled_transactions";

-- Rename the transaction FK column to match the new schema mapping
ALTER TABLE "Transaction" RENAME COLUMN "billId" TO "scheduled_transaction_id";

-- Rename indexes to match Prisma's expected names
ALTER INDEX "Bill_pkey" RENAME TO "scheduled_transactions_pkey";
ALTER INDEX "Bill_userId_idx" RENAME TO "scheduled_transactions_userId_idx";
ALTER INDEX "Bill_nextDueDate_idx" RENAME TO "scheduled_transactions_nextDueDate_idx";
ALTER INDEX "Bill_status_idx" RENAME TO "scheduled_transactions_status_idx";
ALTER INDEX "Transaction_billId_idx" RENAME TO "Transaction_scheduled_transaction_id_idx";

-- Rename foreign key constraints so Prisma does not see drift
ALTER TABLE "scheduled_transactions"
  RENAME CONSTRAINT "Bill_accountId_fkey" TO "scheduled_transactions_accountId_fkey";

ALTER TABLE "scheduled_transactions"
  RENAME CONSTRAINT "Bill_categoryId_fkey" TO "scheduled_transactions_categoryId_fkey";

ALTER TABLE "Transaction"
  RENAME CONSTRAINT "Transaction_billId_fkey" TO "Transaction_scheduled_transaction_id_fkey";
