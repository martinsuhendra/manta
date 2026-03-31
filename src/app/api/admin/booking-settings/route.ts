import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAdmin } from "@/lib/api-utils";
import { getBookingSettings } from "@/lib/booking-settings";
import { prisma } from "@/lib/generated/prisma";

const updateSchema = z.object({
  endBookingPeriodHours: z.number().int().min(0).max(720),
  cancellationDeadlineHours: z.number().int().min(0).max(720),
});

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const brandId = request.headers.get("x-brand-id");
    if (!brandId || brandId === "ALL") {
      return NextResponse.json({ error: "Select a single brand to view booking settings" }, { status: 400 });
    }

    const settings = await getBookingSettings(brandId);
    return NextResponse.json(settings);
  } catch (err) {
    return handleApiError(err, "Failed to fetch booking settings");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const brandId = request.headers.get("x-brand-id");
    if (!brandId || brandId === "ALL") {
      return NextResponse.json({ error: "Select a single brand to update booking settings" }, { status: 400 });
    }

    const body = await request.json();
    const validated = updateSchema.parse(body);

    const existing = await prisma.bookingSettings.findFirst({
      where: { brandId },
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
          brandId,
          endBookingPeriodHours: validated.endBookingPeriodHours,
          cancellationDeadlineHours: validated.cancellationDeadlineHours,
        },
      });
    }

    const settings = await getBookingSettings(brandId);
    return NextResponse.json(settings);
  } catch (err) {
    return handleApiError(err, "Failed to update booking settings");
  }
}
