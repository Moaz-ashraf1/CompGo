-- CreateEnum
CREATE TYPE "SettlementPaymentMethod" AS ENUM ('INSTAPAY', 'VODAFONE_CASH');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN "instapayNumber" TEXT,
ADD COLUMN "vodafoneCashNumber" TEXT;

-- CreateTable
CREATE TABLE "SettlementSubmission" (
    "id" TEXT NOT NULL,
    "captainId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "SettlementPaymentMethod" NOT NULL,
    "screenshotUrl" TEXT NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "SettlementSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SettlementSubmission_captainId_idx" ON "SettlementSubmission"("captainId");

-- CreateIndex
CREATE INDEX "SettlementSubmission_status_idx" ON "SettlementSubmission"("status");
