import { z } from "zod";

import { FREEZE_REASON } from "@/lib/constants/freeze";

export const approveFreezeSchema = z
  .object({
    presetDays: z.number().int().positive().optional(),
    customDays: z.number().int().positive().optional(),
    freezeEndDate: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasPreset = data.presetDays !== undefined;
      const hasCustom = data.customDays !== undefined;
      const hasEndDate = data.freezeEndDate !== undefined && data.freezeEndDate.length > 0;
      return (hasPreset ? 1 : 0) + (hasCustom ? 1 : 0) + (hasEndDate ? 1 : 0) === 1;
    },
    { message: "Provide exactly one: preset days, custom days, or end date" },
  );

export type ApproveFreezeForm = z.infer<typeof approveFreezeSchema>;

export const rejectFreezeSchema = z.object({
  rejectionReason: z.string().max(500).optional(),
});

export type RejectFreezeForm = z.infer<typeof rejectFreezeSchema>;

export const requestFreezeSchema = z.object({
  membershipId: z.string().min(1, "Membership is required"),
  reason: z.enum([FREEZE_REASON.MEDICAL, FREEZE_REASON.PERSONAL]),
  reasonDetails: z.string().max(500).optional(),
});

export type RequestFreezeForm = z.infer<typeof requestFreezeSchema>;
