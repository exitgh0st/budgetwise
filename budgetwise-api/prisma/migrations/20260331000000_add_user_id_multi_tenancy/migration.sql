-- DropIndex
DROP INDEX "Budget_categoryId_month_year_key";

-- DropIndex
DROP INDEX "Category_name_key";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "RecurringTransaction" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Budget_userId_idx" ON "Budget"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_categoryId_month_year_userId_key" ON "Budget"("categoryId", "month", "year", "userId");

-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "Category"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_userId_key" ON "Category"("name", "userId");

-- CreateIndex
CREATE INDEX "ChatSession_userId_idx" ON "ChatSession"("userId");

-- CreateIndex
CREATE INDEX "RecurringTransaction_userId_idx" ON "RecurringTransaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
