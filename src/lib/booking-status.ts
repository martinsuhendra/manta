const BOOKING_STATUSES_THAT_CONSUME_QUOTA = new Set(["RESERVED", "CONFIRMED"]);

export function doesBookingStatusConsumeQuota(status: string): boolean {
  return BOOKING_STATUSES_THAT_CONSUME_QUOTA.has(status);
}

export function getCapacityBookingStatuses(): string[] {
  return ["RESERVED", "CONFIRMED"];
}
