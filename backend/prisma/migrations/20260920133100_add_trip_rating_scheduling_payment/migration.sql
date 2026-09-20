-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'INSTAPAY', 'WALLET');

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "passengers" INTEGER,
ADD COLUMN     "luggageCount" INTEGER,
ADD COLUMN     "flightNumber" TEXT,
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "ratingComment" TEXT;
