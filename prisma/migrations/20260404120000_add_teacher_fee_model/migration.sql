-- CreateEnum
CREATE TYPE "TeacherFeeModel" AS ENUM ('FLAT_PER_SESSION', 'PER_PARTICIPANT');

-- AlterTable
ALTER TABLE "teacher_items" ADD COLUMN "fee_model" "TeacherFeeModel" NOT NULL DEFAULT 'FLAT_PER_SESSION';
