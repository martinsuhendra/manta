-- CreateEnum
CREATE TYPE "SessionVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "class_sessions"
ADD COLUMN "visibility" "SessionVisibility" NOT NULL DEFAULT 'PUBLIC';
