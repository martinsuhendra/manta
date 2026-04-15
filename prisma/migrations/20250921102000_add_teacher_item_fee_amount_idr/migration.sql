-- AlterTable (idempotent: column may exist from legacy migration name)
ALTER TABLE "public"."teacher_items" ADD COLUMN IF NOT EXISTS "fee_amount" INTEGER NOT NULL DEFAULT 0;
