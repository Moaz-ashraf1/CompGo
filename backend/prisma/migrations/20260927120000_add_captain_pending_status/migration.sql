-- AlterEnum
ALTER TYPE "CaptainStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "Captain" ALTER COLUMN "status" SET DEFAULT 'PENDING';
