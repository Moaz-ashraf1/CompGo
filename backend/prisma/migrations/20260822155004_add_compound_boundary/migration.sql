-- AlterTable
ALTER TABLE "Captain" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "CompoundBoundary" (
    "id" TEXT NOT NULL,
    "points" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompoundBoundary_pkey" PRIMARY KEY ("id")
);
