/*
  Warnings:

  - Added the required column `pickupLabel` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "dropoffLabel" TEXT,
ADD COLUMN     "pickupLabel" TEXT NOT NULL;
