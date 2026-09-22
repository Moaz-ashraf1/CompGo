-- CreateEnum
CREATE TYPE "OrderPlacesPricingMode" AS ENUM ('FLAT', 'PER_PLACE');

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN "placesCount" INTEGER;

-- AlterTable
ALTER TABLE "PricingConfig"
  ADD COLUMN "orderPlacesMode" "OrderPlacesPricingMode" NOT NULL DEFAULT 'FLAT',
  ADD COLUMN "orderExtraPlacePrice" DECIMAL(10,2);
