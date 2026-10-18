ALTER TABLE "WalletTransaction" ADD COLUMN "method" TEXT;
ALTER TABLE "WalletTransaction" ADD COLUMN "note" TEXT;
ALTER TABLE "WalletTransaction" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "WalletTransaction" ADD COLUMN "reversalOfId" TEXT;
