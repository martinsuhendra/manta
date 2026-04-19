-- CreateTable (public schema explicit — matches later migrations that reference "public"."booking_settings")
CREATE TABLE IF NOT EXISTS "public"."booking_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "end_booking_period_hours" INTEGER NOT NULL DEFAULT 0,
    "cancellation_deadline_hours" INTEGER NOT NULL DEFAULT 24,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "booking_settings_pkey" PRIMARY KEY ("id")
);
