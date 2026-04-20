import type { BookingStatus } from "@prisma/client";

const CAPACITY_BOOKING_STATUSES: BookingStatus[] = ["RESERVED", "CONFIRMED"];
const BOOKING_STATUSES_THAT_CONSUME_QUOTA = new Set<string>(CAPACITY_BOOKING_STATUSES);

export function doesBookingStatusConsumeQuota(status: string): boolean {
  return BOOKING_STATUSES_THAT_CONSUME_QUOTA.has(status);
}

export function getCapacityBookingStatuses(): BookingStatus[] {
  return CAPACITY_BOOKING_STATUSES;
}
