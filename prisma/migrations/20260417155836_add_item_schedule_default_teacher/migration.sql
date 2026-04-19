-- AlterTable
ALTER TABLE "item_schedules" ADD COLUMN     "teacher_id" UUID;

-- CreateIndex
CREATE INDEX "item_schedules_teacher_id_idx" ON "item_schedules"("teacher_id");

-- AddForeignKey
ALTER TABLE "item_schedules" ADD CONSTRAINT "item_schedules_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
