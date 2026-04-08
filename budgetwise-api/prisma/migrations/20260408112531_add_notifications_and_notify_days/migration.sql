-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SCHEDULED_TX_DUE');

-- AlterTable
ALTER TABLE "scheduled_transactions" ADD COLUMN     "notifyDaysBefore" INTEGER;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduledTransactionId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_scheduledTransactionId_fkey" FOREIGN KEY ("scheduledTransactionId") REFERENCES "scheduled_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
