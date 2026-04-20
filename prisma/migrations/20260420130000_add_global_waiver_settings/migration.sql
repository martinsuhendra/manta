-- Add waiver acceptance metadata on users
ALTER TABLE "public"."users"
ADD COLUMN IF NOT EXISTS "waiver_accepted_at" TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS "waiver_accepted_version" INTEGER,
ADD COLUMN IF NOT EXISTS "waiver_accepted_ip" TEXT,
ADD COLUMN IF NOT EXISTS "waiver_accepted_user_agent" TEXT;

-- Create global waiver settings table
CREATE TABLE IF NOT EXISTS "public"."waiver_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL DEFAULT 'GLOBAL',
    "content_html" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "waiver_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "waiver_settings_key_key" ON "public"."waiver_settings"("key");

ALTER TABLE "public"."waiver_settings"
ADD CONSTRAINT "waiver_settings_updated_by_id_fkey"
FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
