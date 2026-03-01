-- AlterTable
ALTER TABLE "products" ADD COLUMN "participants_per_purchase" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "participant_count" INTEGER NOT NULL DEFAULT 1;
