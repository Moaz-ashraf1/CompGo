-- CreateTable
CREATE TABLE "PricingConfig" (
    "id" TEXT NOT NULL,
    "rideInsideCompoundPrice" DECIMAL(10,2) NOT NULL,
    "rideOutsidePricePerKm" DECIMAL(10,2) NOT NULL,
    "orderInsideCompoundPrice" DECIMAL(10,2) NOT NULL,
    "airportPrice" DECIMAL(10,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingConfig_pkey" PRIMARY KEY ("id")
);
