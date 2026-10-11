-- AlterEnum
ALTER TYPE "OutsideCompoundPricingMode" ADD VALUE 'DISTANCE_BANDS';

-- AlterTable
ALTER TABLE "PricingConfig" ADD COLUMN "outsideBandLimitKm" DECIMAL(10,2),
ADD COLUMN "outsideRateNearKm" DECIMAL(10,2),
ADD COLUMN "outsideRateFarKm" DECIMAL(10,2),
ADD COLUMN "airportCardFee" DECIMAL(10,2),
ADD COLUMN "commissionRules" JSONB;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN "companyShare" DECIMAL(10,2);
