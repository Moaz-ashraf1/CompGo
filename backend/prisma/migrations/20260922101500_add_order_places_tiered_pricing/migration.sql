-- AlterEnum
ALTER TYPE "OrderPlacesPricingMode" ADD VALUE 'TIERED';

-- AlterTable
ALTER TABLE "PricingConfig" ADD COLUMN "orderPlaceTiers" JSONB;
