/*
  Warnings:

  - You are about to drop the column `activation_limit` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `product_name` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `users` table. All the data in the column will be lost.
  - Added the required column `remaining_quota` to the `memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `memberships` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."memberships" DROP COLUMN "activation_limit",
DROP COLUMN "product_name",
ADD COLUMN     "remaining_quota" INTEGER NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
DROP COLUMN "product_id",
ADD COLUMN     "product_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "paymentMethod";

-- CreateTable
CREATE TABLE "public"."membership_products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "valid_days" INTEGER NOT NULL,
    "quota" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "membership_products_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."memberships" ADD CONSTRAINT "memberships_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."membership_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
