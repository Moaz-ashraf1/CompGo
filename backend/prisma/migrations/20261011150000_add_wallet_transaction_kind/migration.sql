-- CreateEnum
CREATE TYPE "WalletTransactionKind" AS ENUM ('ADJUSTMENT', 'PENALTY', 'COLLECTION');

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN "kind" "WalletTransactionKind" NOT NULL DEFAULT 'ADJUSTMENT';

-- Cancellation penalties used to be stored as plain adjustments.
UPDATE "WalletTransaction" SET "kind" = 'PENALTY' WHERE "reason" LIKE 'غرامة%';
