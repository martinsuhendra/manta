-- CreateTable
CREATE TABLE "public"."membership_freeze_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "membership_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "reason_details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "requested_by_id" UUID NOT NULL,
    "approved_by_id" UUID,
    "rejection_reason" TEXT,
    "freeze_start_date" TIMESTAMP(6),
    "freeze_end_date" TIMESTAMP(6),
    "total_frozen_days" INTEGER,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "membership_freeze_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "membership_freeze_requests_membership_id_idx" ON "public"."membership_freeze_requests"("membership_id");

-- CreateIndex
CREATE INDEX "membership_freeze_requests_status_idx" ON "public"."membership_freeze_requests"("status");

-- CreateIndex
CREATE INDEX "membership_freeze_requests_freeze_end_date_idx" ON "public"."membership_freeze_requests"("freeze_end_date");

-- AddForeignKey
ALTER TABLE "public"."membership_freeze_requests" ADD CONSTRAINT "membership_freeze_requests_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."membership_freeze_requests" ADD CONSTRAINT "membership_freeze_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."membership_freeze_requests" ADD CONSTRAINT "membership_freeze_requests_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
