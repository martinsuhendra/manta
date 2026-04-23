-- Rename BookingStatus enum value while preserving existing rows
ALTER TYPE "public"."BookingStatus" RENAME VALUE 'CONFIRMED' TO 'CHECKED_IN';
