-- CreateEnum
CREATE TYPE "LegalPageKey" AS ENUM ('TERMS_CLIENT', 'TERMS_CAPTAIN', 'PRIVACY_CLIENT', 'PRIVACY_CAPTAIN');

-- CreateTable
CREATE TABLE "LegalPage" (
    "key" "LegalPageKey" NOT NULL,
    "sections" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalPage_pkey" PRIMARY KEY ("key")
);
