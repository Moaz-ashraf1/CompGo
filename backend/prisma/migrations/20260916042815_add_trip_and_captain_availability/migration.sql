-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('RIDE', 'ORDER', 'AIRPORT');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Captain" ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "type" "TripType" NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'REQUESTED',
    "clientId" TEXT NOT NULL,
    "captainId" TEXT,
    "pickupLat" DECIMAL(10,7) NOT NULL,
    "pickupLng" DECIMAL(10,7) NOT NULL,
    "dropoffLat" DECIMAL(10,7),
    "dropoffLng" DECIMAL(10,7),
    "isInsideCompound" BOOLEAN NOT NULL,
    "distanceKm" DECIMAL(10,2),
    "price" DECIMAL(10,2) NOT NULL,
    "cancelReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trip_clientId_idx" ON "Trip"("clientId");

-- CreateIndex
CREATE INDEX "Trip_captainId_idx" ON "Trip"("captainId");

-- CreateIndex
CREATE INDEX "Trip_status_idx" ON "Trip"("status");
