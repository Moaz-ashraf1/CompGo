-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "isSuper" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "permissions" JSONB NOT NULL DEFAULT '{}';

-- Every admin that existed before permissions were introduced keeps full access.
UPDATE "Admin" SET "isSuper" = true;
