// Midtrans Constants

export const SNAP_TOKEN_EXPIRY_HOURS = 24;
export const SNAP_TOKEN_EXPIRY_MS = SNAP_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

export const TRANSACTION_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
  EXPIRED: "EXPIRED",
} as const;

export const MEMBERSHIP_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;

export type TransactionStatus = (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];
export type MembershipStatus = (typeof MEMBERSHIP_STATUS)[keyof typeof MEMBERSHIP_STATUS];

// Transaction statuses that should suspend memberships
export const SUSPENDED_TRANSACTION_STATUSES: TransactionStatus[] = [
  TRANSACTION_STATUS.FAILED,
  TRANSACTION_STATUS.CANCELLED,
  TRANSACTION_STATUS.EXPIRED,
  TRANSACTION_STATUS.REFUNDED,
];
