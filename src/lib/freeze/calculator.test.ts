import { describe, expect, it } from "vitest";

import {
  calculateFreezeEndDate,
  calculateTotalFrozenDays,
  extendExpirationByFreezeDays,
  shouldExtendExpiration,
} from "./calculator";

describe("calculateFreezeEndDate", () => {
  it("adds preset days to start date", () => {
    const start = new Date("2025-02-01T00:00:00Z");
    const end = calculateFreezeEndDate(start, 7);
    expect(end.toISOString()).toBe("2025-02-08T00:00:00.000Z");
  });

  it("adds custom days correctly", () => {
    const start = new Date("2025-02-01T00:00:00Z");
    const end = calculateFreezeEndDate(start, 30);
    expect(end.toISOString()).toBe("2025-03-03T00:00:00.000Z");
  });

  it("handles 1 day correctly", () => {
    const start = new Date("2025-02-01T00:00:00Z");
    const end = calculateFreezeEndDate(start, 1);
    expect(end.toISOString()).toBe("2025-02-02T00:00:00.000Z");
  });
});

describe("calculateTotalFrozenDays", () => {
  it("calculates days between start and end", () => {
    const start = new Date("2025-02-01T00:00:00Z");
    const end = new Date("2025-02-08T00:00:00Z");
    expect(calculateTotalFrozenDays(start, end)).toBe(7);
  });

  it("handles 14 days", () => {
    const start = new Date("2025-02-01T00:00:00Z");
    const end = new Date("2025-02-15T00:00:00Z");
    expect(calculateTotalFrozenDays(start, end)).toBe(14);
  });
});

describe("shouldExtendExpiration", () => {
  it("returns true when membership would expire during freeze", () => {
    const expiredAt = new Date("2025-02-10T00:00:00Z");
    const freezeStart = new Date("2025-02-01T00:00:00Z");
    const freezeEnd = new Date("2025-02-20T00:00:00Z");
    expect(shouldExtendExpiration(expiredAt, freezeStart, freezeEnd)).toBe(true);
  });

  it("returns false when membership expires after freeze", () => {
    const expiredAt = new Date("2025-02-25T00:00:00Z");
    const freezeStart = new Date("2025-02-01T00:00:00Z");
    const freezeEnd = new Date("2025-02-20T00:00:00Z");
    expect(shouldExtendExpiration(expiredAt, freezeStart, freezeEnd)).toBe(false);
  });

  it("returns false when membership expired before freeze", () => {
    const expiredAt = new Date("2025-01-25T00:00:00Z");
    const freezeStart = new Date("2025-02-01T00:00:00Z");
    const freezeEnd = new Date("2025-02-20T00:00:00Z");
    expect(shouldExtendExpiration(expiredAt, freezeStart, freezeEnd)).toBe(false);
  });
});

describe("extendExpirationByFreezeDays", () => {
  it("extends expiration by frozen days", () => {
    const expiredAt = new Date("2025-02-10T00:00:00Z");
    const extended = extendExpirationByFreezeDays(expiredAt, 7);
    expect(extended.toISOString()).toBe("2025-02-17T00:00:00.000Z");
  });

  it("extends by 30 days", () => {
    const expiredAt = new Date("2025-02-01T00:00:00Z");
    const extended = extendExpirationByFreezeDays(expiredAt, 30);
    expect(extended.toISOString()).toBe("2025-03-03T00:00:00.000Z");
  });
});
