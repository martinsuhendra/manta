-- Item <-> Brand many-to-many via item_brands; drop items.brandId (data preserved in junction).

CREATE TABLE "item_brands" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "item_id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_brands_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "item_brands_item_id_brand_id_key" ON "item_brands"("item_id", "brand_id");

INSERT INTO "item_brands" ("id", "item_id", "brand_id", "created_at")
SELECT gen_random_uuid(), "id", "brandId", CURRENT_TIMESTAMP FROM "items";

ALTER TABLE "item_brands" ADD CONSTRAINT "item_brands_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "item_brands" ADD CONSTRAINT "item_brands_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "items" DROP CONSTRAINT "items_brandId_fkey";

ALTER TABLE "items" DROP COLUMN "brandId";
