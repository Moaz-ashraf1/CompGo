-- CreateEnum
CREATE TYPE "OutsideCompoundPricingMode" AS ENUM ('PER_KM', 'FLAT', 'THRESHOLD');

-- AlterTable
ALTER TABLE "PricingConfig"
  ADD COLUMN "outsideCompoundMode" "OutsideCompoundPricingMode" NOT NULL DEFAULT 'PER_KM',
  ADD COLUMN "outsideCompoundFlatPrice" DECIMAL(10,2),
  ADD COLUMN "outsideCompoundBasePrice" DECIMAL(10,2),
  ADD COLUMN "outsideCompoundThresholdKm" DECIMAL(10,2);
