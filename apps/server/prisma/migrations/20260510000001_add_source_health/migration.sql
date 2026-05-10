-- AlterTable
ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "is_online" BOOLEAN;
ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "last_checked_at" TIMESTAMP(3);
