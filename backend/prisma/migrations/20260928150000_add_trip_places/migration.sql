-- CreateTable
CREATE TABLE "TripPlace" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "details" TEXT,
    "order" INTEGER NOT NULL,
    "collected" BOOLEAN NOT NULL DEFAULT false,
    "collectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripPlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripPlace_tripId_idx" ON "TripPlace"("tripId");

-- AddForeignKey
ALTER TABLE "TripPlace" ADD CONSTRAINT "TripPlace_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
