import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAdmin } from "@/lib/api-utils";
import { getBookingSettings } from "@/lib/booking-settings";
import { prisma } from "@/lib/generated/prisma";

const updateSchema = z.object({
  endBookingPeriodHours: z.number().int().min(0).max(720),
  cancellationDeadlineHours: z.number().int().min(0).max(720),
});

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const settings = await getBookingSettings();
    return NextResponse.json(settings);
  } catch (err) {
    return handleApiError(err, "Failed to fetch booking settings");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const validated = updateSchema.parse(body);

    const existing = await prisma.bookingSettings.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (existing) {
      await prisma.bookingSettings.update({
        where: { id: existing.id },
        data: {
          endBookingPeriodHours: validated.endBookingPeriodHours,
          cancellationDeadlineHours: validated.cancellationDeadlineHours,
        },
      });
    } else {
      await prisma.bookingSettings.create({
        data: {
          endBookingPeriodHours: validated.endBookingPeriodHours,
          cancellationDeadlineHours: validated.cancellationDeadlineHours,
        },
      });
    }

    const settings = await getBookingSettings();
    return NextResponse.json(settings);
  } catch (err) {
    return handleApiError(err, "Failed to update booking settings");
  }
}
