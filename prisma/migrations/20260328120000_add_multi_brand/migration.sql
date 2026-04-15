-- Multi-brand: brands, brand_users, and brandId on all scoped tables.
-- Default brand id used for backfilling existing rows.
-- Prisma field names use camelCase for unmapped columns (e.g. "brandId").

-- CreateTable brands
CREATE TABLE "public"."brands" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT,
    "logo" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#6366f1',
    "accentColor" TEXT NOT NULL DEFAULT '#8b5cf6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "brands_slug_key" ON "public"."brands"("slug");

-- Default tenant (all existing data is assigned here)
INSERT INTO "public"."brands" ("id", "name", "slug", "primaryColor", "accentColor", "isActive", "createdAt", "updatedAt")
VALUES (
    '00000000-0000-4000-8000-000000000001',
    'Default',
    'default',
    '#6366f1',
    '#8b5cf6',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- CreateTable brand_users
CREATE TABLE "public"."brand_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "brandId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "brand_users_brandId_userId_key" ON "public"."brand_users"("brandId", "userId");

ALTER TABLE "public"."brand_users" ADD CONSTRAINT "brand_users_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."brand_users" ADD CONSTRAINT "brand_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- products
ALTER TABLE "public"."products" ADD COLUMN "brandId" UUID;

UPDATE "public"."products" SET "brandId" = '00000000-0000-4000-8000-000000000001' WHERE "brandId" IS NULL;

ALTER TABLE "public"."products" ALTER COLUMN "brandId" SET NOT NULL;

ALTER TABLE "public"."products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- items
ALTER TABLE "public"."items" ADD COLUMN "brandId" UUID;

UPDATE "public"."items" SET "brandId" = '00000000-0000-4000-8000-000000000001' WHERE "brandId" IS NULL;

ALTER TABLE "public"."items" ALTER COLUMN "brandId" SET NOT NULL;

ALTER TABLE "public"."items" ADD CONSTRAINT "items_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- transactions (derive from product)
ALTER TABLE "public"."transactions" ADD COLUMN "brandId" UUID;

UPDATE "public"."transactions" t
SET "brandId" = p."brandId"
FROM "public"."products" p
WHERE t."product_id" = p."id";

UPDATE "public"."transactions" SET "brandId" = '00000000-0000-4000-8000-000000000001' WHERE "brandId" IS NULL;

ALTER TABLE "public"."transactions" ALTER COLUMN "brandId" SET NOT NULL;

ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- memberships
ALTER TABLE "public"."memberships" ADD COLUMN "brandId" UUID;

UPDATE "public"."memberships" m
SET "brandId" = p."brandId"
FROM "public"."products" p
WHERE m."product_id" = p."id";

UPDATE "public"."memberships" SET "brandId" = '00000000-0000-4000-8000-000000000001' WHERE "brandId" IS NULL;

ALTER TABLE "public"."memberships" ALTER COLUMN "brandId" SET NOT NULL;

ALTER TABLE "public"."memberships" ADD CONSTRAINT "memberships_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- class_sessions (derive from item)
ALTER TABLE "public"."class_sessions" ADD COLUMN "brandId" UUID;

UPDATE "public"."class_sessions" cs
SET "brandId" = i."brandId"
FROM "public"."items" i
WHERE cs."item_id" = i."id";

UPDATE "public"."class_sessions" SET "brandId" = '00000000-0000-4000-8000-000000000001' WHERE "brandId" IS NULL;

ALTER TABLE "public"."class_sessions" ALTER COLUMN "brandId" SET NOT NULL;

ALTER TABLE "public"."class_sessions" ADD CONSTRAINT "class_sessions_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- bookings (derive from class session)
ALTER TABLE "public"."bookings" ADD COLUMN "brandId" UUID;

UPDATE "public"."bookings" b
SET "brandId" = cs."brandId"
FROM "public"."class_sessions" cs
WHERE b."class_session_id" = cs."id";

UPDATE "public"."bookings" SET "brandId" = '00000000-0000-4000-8000-000000000001' WHERE "brandId" IS NULL;

ALTER TABLE "public"."bookings" ALTER COLUMN "brandId" SET NOT NULL;

ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- quota_pools
ALTER TABLE "public"."quota_pools" ADD COLUMN "brandId" UUID;

UPDATE "public"."quota_pools" qp
SET "brandId" = p."brandId"
FROM "public"."products" p
WHERE qp."product_id" = p."id";

UPDATE "public"."quota_pools" SET "brandId" = '00000000-0000-4000-8000-000000000001' WHERE "brandId" IS NULL;

ALTER TABLE "public"."quota_pools" ALTER COLUMN "brandId" SET NOT NULL;

ALTER TABLE "public"."quota_pools" ADD CONSTRAINT "quota_pools_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- booking_settings (at most one row in practice)
-- Table is created in 20250914070000; IF NOT EXISTS covers shadow DB / ordering edge cases.
CREATE TABLE IF NOT EXISTS "public"."booking_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "end_booking_period_hours" INTEGER NOT NULL DEFAULT 0,
    "cancellation_deadline_hours" INTEGER NOT NULL DEFAULT 24,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "booking_settings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."booking_settings" ADD COLUMN IF NOT EXISTS "brandId" UUID;

UPDATE "public"."booking_settings" SET "brandId" = '00000000-0000-4000-8000-000000000001' WHERE "brandId" IS NULL;

INSERT INTO "public"."booking_settings" ("id", "brandId", "end_booking_period_hours", "cancellation_deadline_hours", "created_at", "updated_at")
SELECT gen_random_uuid(), '00000000-0000-4000-8000-000000000001'::uuid, 0, 24, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "public"."booking_settings");

UPDATE "public"."booking_settings" SET "brandId" = '00000000-0000-4000-8000-000000000001' WHERE "brandId" IS NULL;

ALTER TABLE "public"."booking_settings" ALTER COLUMN "brandId" SET NOT NULL;

ALTER TABLE "public"."booking_settings" ADD CONSTRAINT "booking_settings_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Every user can access the default brand (matches app registration / JWT default)
INSERT INTO "public"."brand_users" ("id", "brandId", "userId", "role", "isDefault", "createdAt")
SELECT gen_random_uuid(), '00000000-0000-4000-8000-000000000001'::uuid, u."id", u."role", true, CURRENT_TIMESTAMP
FROM "public"."users" u;
