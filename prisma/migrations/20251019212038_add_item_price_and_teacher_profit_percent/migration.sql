-- AlterTable
ALTER TABLE "items" ADD COLUMN "price" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "teacher_items" ADD COLUMN "teacher_profit_percent" DECIMAL(5,2) NOT NULL DEFAULT 60;

