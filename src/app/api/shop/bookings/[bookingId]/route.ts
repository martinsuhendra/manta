import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { requireBrandAccess } from "@/lib/api-utils";
import { canMemberCancel, getBookingSettings, getSessionStartAt } from "@/lib/booking-settings";
import { prisma } from "@/lib/generated/prisma";
import { restoreQuota } from "@/lib/quota-utils";
import { USER_ROLES } from "@/lib/types";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.MEMBER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error, brandIds } = await requireBrandAccess(request);
    if (error) return error;
    const selectedBrandId = request.headers.get("x-brand-id") ?? brandIds?.[0] ?? null;
    if (!selectedBrandId) {
      return NextResponse.json({ error: "No active brand selected" }, { status: 400 });
    }
    if (!brandIds?.includes(selectedBrandId)) {
      return NextResponse.json({ error: "Forbidden for this brand" }, { status: 403 });
    }

    const userId = session.user.id;
    const { bookingId } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        classSession: {
          select: { itemId: true, date: true, startTime: true },
        },
        membership: {
          select: { productId: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.brandId !== selectedBrandId) {
      return NextResponse.json({ error: "Booking not found for selected brand" }, { status: 404 });
    }

    if (booking.userId !== userId) {
      return NextResponse.json({ error: "You can only cancel your own bookings" }, { status: 403 });
    }

    const settings = await getBookingSettings(selectedBrandId);
    const sessionStartAt = getSessionStartAt({
      date: booking.classSession.date,
      startTime: booking.classSession.startTime,
    });
    if (!canMemberCancel(sessionStartAt, settings.cancellationDeadlineHours)) {
      return NextResponse.json({ error: "Cancellation is no longer allowed for this session." }, { status: 400 });
    }

    const productItem =
      booking.status === "CONFIRMED" || booking.status === "RESERVED"
        ? await prisma.productItem.findFirst({
            where: {
              productId: booking.membership.productId,
              itemId: booking.classSession.itemId,
            },
            include: { quotaPool: true },
          })
        : null;

    await prisma.$transaction(async (tx) => {
      await tx.booking.delete({
        where: { id: bookingId },
      });

      if (productItem) await restoreQuota({ tx, membershipId: booking.membershipId, productItem });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
