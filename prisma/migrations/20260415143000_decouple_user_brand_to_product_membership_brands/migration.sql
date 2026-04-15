-- Create join table for Product <-> Brand (many-to-many)
CREATE TABLE IF NOT EXISTS "product_brands" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_brands_pkey" PRIMARY KEY ("id")
);

-- Create join table for Membership <-> Brand (many-to-many)
CREATE TABLE IF NOT EXISTS "membership_brands" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "membership_id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_brands_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys and unique constraints
ALTER TABLE "product_brands"
    ADD CONSTRAINT "product_brands_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_brands"
    ADD CONSTRAINT "product_brands_brand_id_fkey"
    FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_brands"
    ADD CONSTRAINT "product_brands_product_id_brand_id_key" UNIQUE ("product_id", "brand_id");

ALTER TABLE "membership_brands"
    ADD CONSTRAINT "membership_brands_membership_id_fkey"
    FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "membership_brands"
    ADD CONSTRAINT "membership_brands_brand_id_fkey"
    FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "membership_brands"
    ADD CONSTRAINT "membership_brands_membership_id_brand_id_key" UNIQUE ("membership_id", "brand_id");

-- Helpful indexes for brand filtering
CREATE INDEX IF NOT EXISTS "product_brands_brand_id_idx" ON "product_brands"("brand_id");
CREATE INDEX IF NOT EXISTS "membership_brands_brand_id_idx" ON "membership_brands"("brand_id");

-- Backfill existing Product.brandId -> product_brands
INSERT INTO "product_brands" ("product_id", "brand_id")
SELECT "id", "brandId"
FROM "products"
WHERE "brandId" IS NOT NULL
ON CONFLICT ("product_id", "brand_id") DO NOTHING;

-- Backfill existing Membership.brandId -> membership_brands
INSERT INTO "membership_brands" ("membership_id", "brand_id")
SELECT "id", "brandId"
FROM "memberships"
WHERE "brandId" IS NOT NULL
ON CONFLICT ("membership_id", "brand_id") DO NOTHING;

-- Remove user-brand direct mapping table
DROP TABLE IF EXISTS "brand_users";

-- Remove legacy single-brand columns after backfill
ALTER TABLE "products"
    DROP COLUMN IF EXISTS "brandId";

ALTER TABLE "memberships"
    DROP COLUMN IF EXISTS "brandId";
