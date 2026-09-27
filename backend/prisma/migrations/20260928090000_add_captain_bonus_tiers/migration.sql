-- AlterTable
ALTER TABLE "Trip" ADD COLUMN "cancelledBy" "AccountRole";

-- CreateTable
CREATE TABLE "CaptainBonusTier" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "minInsideTrips" INTEGER NOT NULL DEFAULT 0,
    "minOutsideTrips" INTEGER NOT NULL DEFAULT 0,
    "minAvgRating" DECIMAL(3,2),
    "maxCancellations" INTEGER,
    "bonusPercentage" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaptainBonusTier_pkey" PRIMARY KEY ("id")
);
