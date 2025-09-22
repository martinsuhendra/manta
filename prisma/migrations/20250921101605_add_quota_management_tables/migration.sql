/*
  Warnings:

  - You are about to drop the column `remaining_quota` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `use_count` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `quota` on the `products` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."QuotaType" AS ENUM ('INDIVIDUAL', 'SHARED', 'FREE');

-- AlterTable
ALTER TABLE "public"."memberships" DROP COLUMN "remaining_quota",
DROP COLUMN "use_count";

-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "quota";

-- CreateTable
CREATE TABLE "public"."items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "image" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."teacher_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "teacher_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."item_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "item_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "item_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."class_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "item_id" UUID NOT NULL,
    "teacher_id" UUID,
    "date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "class_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "quota_type" "public"."QuotaType" NOT NULL,
    "quota_value" INTEGER,
    "quota_pool_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "product_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "class_session_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "status" "public"."BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quota_pools" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "total_quota" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "quota_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."membership_quota_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "membership_id" UUID NOT NULL,
    "product_item_id" UUID,
    "quota_pool_id" UUID,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "membership_quota_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_items_teacher_id_item_id_key" ON "public"."teacher_items"("teacher_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_sessions_item_id_date_start_time_key" ON "public"."class_sessions"("item_id", "date", "start_time");

-- CreateIndex
CREATE INDEX "product_items_product_id_is_active_order_idx" ON "public"."product_items"("product_id", "is_active", "order");

-- CreateIndex
CREATE INDEX "product_items_quota_pool_id_idx" ON "public"."product_items"("quota_pool_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_items_product_id_item_id_key" ON "public"."product_items"("product_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_class_session_id_user_id_key" ON "public"."bookings"("class_session_id", "user_id");

-- CreateIndex
CREATE INDEX "quota_pools_product_id_is_active_idx" ON "public"."quota_pools"("product_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "quota_pools_product_id_name_key" ON "public"."quota_pools"("product_id", "name");

-- CreateIndex
CREATE INDEX "membership_quota_usage_membership_id_idx" ON "public"."membership_quota_usage"("membership_id");

-- CreateIndex
CREATE INDEX "membership_quota_usage_product_item_id_idx" ON "public"."membership_quota_usage"("product_item_id");

-- CreateIndex
CREATE INDEX "membership_quota_usage_quota_pool_id_idx" ON "public"."membership_quota_usage"("quota_pool_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_quota_usage_membership_id_product_item_id_key" ON "public"."membership_quota_usage"("membership_id", "product_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_quota_usage_membership_id_quota_pool_id_key" ON "public"."membership_quota_usage"("membership_id", "quota_pool_id");

-- CreateIndex
CREATE INDEX "products_is_active_position_idx" ON "public"."products"("is_active", "position");

-- CreateIndex
CREATE INDEX "products_is_active_createdAt_idx" ON "public"."products"("is_active", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."teacher_items" ADD CONSTRAINT "teacher_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teacher_items" ADD CONSTRAINT "teacher_items_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_schedules" ADD CONSTRAINT "item_schedules_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."class_sessions" ADD CONSTRAINT "class_sessions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."class_sessions" ADD CONSTRAINT "class_sessions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_items" ADD CONSTRAINT "product_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_items" ADD CONSTRAINT "product_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_items" ADD CONSTRAINT "product_items_quota_pool_id_fkey" FOREIGN KEY ("quota_pool_id") REFERENCES "public"."quota_pools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_class_session_id_fkey" FOREIGN KEY ("class_session_id") REFERENCES "public"."class_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quota_pools" ADD CONSTRAINT "quota_pools_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."membership_quota_usage" ADD CONSTRAINT "membership_quota_usage_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."membership_quota_usage" ADD CONSTRAINT "membership_quota_usage_product_item_id_fkey" FOREIGN KEY ("product_item_id") REFERENCES "public"."product_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."membership_quota_usage" ADD CONSTRAINT "membership_quota_usage_quota_pool_id_fkey" FOREIGN KEY ("quota_pool_id") REFERENCES "public"."quota_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
