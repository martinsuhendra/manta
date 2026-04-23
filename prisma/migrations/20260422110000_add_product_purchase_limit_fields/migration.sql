-- Add purchase limit fields for products.
-- Existing rows default to unlimited purchases.
ALTER TABLE "products"
ADD COLUMN "is_purchase_unlimited" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "purchase_limit_per_user" INTEGER;
