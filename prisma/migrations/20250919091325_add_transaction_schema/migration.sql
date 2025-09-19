/*
  Warnings:

  - You are about to drop the column `customer_email` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `customer_name` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `license_code` on the `memberships` table. All the data in the column will be lost.
  - The `transaction_id` column on the `memberships` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'EXPIRED');

-- DropIndex
DROP INDEX "public"."memberships_license_code_key";

-- AlterTable
ALTER TABLE "public"."memberships" DROP COLUMN "customer_email",
DROP COLUMN "customer_name",
DROP COLUMN "license_code",
DROP COLUMN "transaction_id",
ADD COLUMN     "transaction_id" UUID;

-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" TEXT,
    "payment_provider" TEXT,
    "external_id" TEXT,
    "metadata" JSONB,
    "paid_at" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."memberships" ADD CONSTRAINT "memberships_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
