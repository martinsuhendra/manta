-- AlterTable (idempotent: columns may exist from legacy migration name)
ALTER TABLE "public"."products" ADD COLUMN IF NOT EXISTS "participants_per_purchase" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."bookings" ADD COLUMN IF NOT EXISTS "participant_count" INTEGER NOT NULL DEFAULT 1;
