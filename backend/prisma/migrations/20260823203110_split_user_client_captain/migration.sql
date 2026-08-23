/*
  Warnings:

  - The values [PENDING] on the enum `CaptainStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `gender` on the `Captain` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Captain` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Captain` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Captain` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `passwordHash` to the `Captain` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Captain` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- AlterEnum
BEGIN;
CREATE TYPE "CaptainStatus_new" AS ENUM ('ACTIVE', 'BLOCKED');
ALTER TABLE "public"."Captain" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Captain" ALTER COLUMN "status" TYPE "CaptainStatus_new" USING ("status"::text::"CaptainStatus_new");
ALTER TYPE "CaptainStatus" RENAME TO "CaptainStatus_old";
ALTER TYPE "CaptainStatus_new" RENAME TO "CaptainStatus";
DROP TYPE "public"."CaptainStatus_old";
ALTER TABLE "Captain" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropIndex
DROP INDEX "Captain_phone_key";

-- DropIndex
DROP INDEX "Captain_vehicleNumber_key";

-- AlterTable
ALTER TABLE "Captain" DROP COLUMN "gender",
DROP COLUMN "name",
DROP COLUMN "phone",
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Client_userId_key" ON "Client"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Captain_userId_key" ON "Captain"("userId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Captain" ADD CONSTRAINT "Captain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
