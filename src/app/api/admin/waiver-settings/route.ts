import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAdmin } from "@/lib/api-utils";
import { getWaiverSettings, isMeaningfulWaiverHtml, upsertWaiverSettings } from "@/lib/waiver-settings";

const updateWaiverSchema = z.object({
  contentHtml: z
    .string()
    .min(1, "Waiver content is required")
    .refine((value) => isMeaningfulWaiverHtml(value), "Waiver content cannot be empty"),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const waiver = await getWaiverSettings();
    return NextResponse.json(waiver);
  } catch (err) {
    return handleApiError(err, "Failed to fetch waiver settings");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { error, user } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const validated = updateWaiverSchema.parse(body);

    const waiver = await upsertWaiverSettings({
      contentHtml: validated.contentHtml,
      isActive: validated.isActive,
      updatedById: user.id,
    });

    return NextResponse.json(waiver);
  } catch (err) {
    return handleApiError(err, "Failed to update waiver settings");
  }
}
