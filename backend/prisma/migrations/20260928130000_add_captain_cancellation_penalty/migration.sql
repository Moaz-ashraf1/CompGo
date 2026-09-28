-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN "captainCancellationFreeLimit" INTEGER,
ADD COLUMN "captainCancellationPenaltyAmount" DECIMAL(10,2);
