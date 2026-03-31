-- Add Cloudinary asset metadata JSON columns while keeping legacy URL fields.
ALTER TABLE "brands"
ADD COLUMN "logoAsset" JSONB;

ALTER TABLE "products"
ADD COLUMN "imageAsset" JSONB;

ALTER TABLE "users"
ADD COLUMN "avatarAsset" JSONB;
