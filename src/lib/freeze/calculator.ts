/**
 * Freeze duration and expiration calculation helpers
 */

export function calculateFreezeEndDate(startDate: Date, days: number): Date {
  const end = new Date(startDate);
  end.setDate(end.getDate() + days);
  return end;
}

export function calculateTotalFrozenDays(startDate: Date, endDate: Date): number {
  const diff = endDate.getTime() - startDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Returns true if membership would expire during the freeze period.
 * Used to determine if we need to extend expiredAt.
 */
export function shouldExtendExpiration(expiredAt: Date, freezeStartDate: Date, freezeEndDate: Date): boolean {
  return expiredAt <= freezeEndDate && expiredAt >= freezeStartDate;
}

/**
 * Extends expiredAt by totalFrozenDays when membership would have expired during freeze.
 */
export function extendExpirationByFreezeDays(expiredAt: Date, totalFrozenDays: number): Date {
  const extended = new Date(expiredAt);
  extended.setDate(extended.getDate() + totalFrozenDays);
  return extended;
}
