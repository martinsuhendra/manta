import { describe, expect, it } from "vitest";

import { doesBookingStatusConsumeQuota, getCapacityBookingStatuses } from "./booking-status";

describe("doesBookingStatusConsumeQuota", () => {
  it("returns true for reserved and confirmed", () => {
    expect(doesBookingStatusConsumeQuota("RESERVED")).toBe(true);
    expect(doesBookingStatusConsumeQuota("CONFIRMED")).toBe(true);
  });

  it("returns false for non quota-consuming statuses", () => {
    expect(doesBookingStatusConsumeQuota("WAITLISTED")).toBe(false);
    expect(doesBookingStatusConsumeQuota("CANCELLED")).toBe(false);
    expect(doesBookingStatusConsumeQuota("NO_SHOW")).toBe(false);
  });
});

describe("getCapacityBookingStatuses", () => {
  it("returns statuses that consume participant slots", () => {
    expect(getCapacityBookingStatuses()).toEqual(["RESERVED", "CONFIRMED"]);
  });
});
