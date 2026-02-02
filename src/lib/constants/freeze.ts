export const FREEZE_REQUEST_STATUS = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED",
} as const;

export type FreezeRequestStatus = (typeof FREEZE_REQUEST_STATUS)[keyof typeof FREEZE_REQUEST_STATUS];

export const FREEZE_REASON = {
  MEDICAL: "MEDICAL",
  PERSONAL: "PERSONAL",
} as const;

export type FreezeReason = (typeof FREEZE_REASON)[keyof typeof FREEZE_REASON];

export const FREEZE_REASON_LABELS: Record<FreezeReason, string> = {
  [FREEZE_REASON.MEDICAL]: "Medical",
  [FREEZE_REASON.PERSONAL]: "Personal / Special",
};

export const FREEZE_REQUEST_STATUS_LABELS: Record<FreezeRequestStatus, string> = {
  [FREEZE_REQUEST_STATUS.PENDING_APPROVAL]: "Pending Approval",
  [FREEZE_REQUEST_STATUS.APPROVED]: "Approved",
  [FREEZE_REQUEST_STATUS.REJECTED]: "Rejected",
  [FREEZE_REQUEST_STATUS.COMPLETED]: "Completed",
};

export const FREEZE_PRESET_DAYS = [7, 14, 30] as const;
