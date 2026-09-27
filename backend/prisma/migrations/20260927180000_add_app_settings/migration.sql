-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "supportWhatsappNumber" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);
