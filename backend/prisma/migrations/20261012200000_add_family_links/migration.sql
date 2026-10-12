-- CreateEnum
CREATE TYPE "FamilyRelation" AS ENUM ('FATHER', 'MOTHER', 'SON', 'DAUGHTER', 'HUSBAND', 'WIFE', 'BROTHER', 'SISTER', 'OTHER');

-- CreateEnum
CREATE TYPE "FamilyLinkStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "FamilyLink" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relation" "FamilyRelation" NOT NULL,
    "status" "FamilyLinkStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "FamilyLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FamilyLink_targetId_idx" ON "FamilyLink"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyLink_requesterId_targetId_key" ON "FamilyLink"("requesterId", "targetId");
