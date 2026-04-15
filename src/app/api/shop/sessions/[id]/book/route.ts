/* eslint-disable complexity, @typescript-eslint/no-unnecessary-condition */
import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { requireBrandAccess } from "@/lib/api-utils";
import { getBookingSettings, getSessionStartAt, isPastBookingCutoff } from "@/lib/booking-settings";
import { prisma } from "@/lib/generated/prisma";
import { checkQuotaAvailability, deductQuota } from "@/lib/quota-utils";
import { USER_ROLES } from "@/lib/types";

const bookSchema = z.object({
  membershipId: z.string().uuid("Invalid membership ID"),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    if (brandIds && !brandIds.includes(selectedBrandId)) {
      return NextResponse.json({ error: "Forbidden for this brand" }, { status: 403 });
    }

    const userId = session.user.id;
    const { id: sessionId } = await params;
    const body = await request.json();
    const { membershipId } = bookSchema.parse(body);

    const classSession = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { item: true },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (classSession.brandId !== selectedBrandId) {
      return NextResponse.json({ error: "Session not available for selected brand" }, { status: 404 });
    }

    if (classSession.status !== "SCHEDULED") {
      return NextResponse.json({ error: "Session is not available for booking" }, { status: 400 });
    }

    const settings = await getBookingSettings(selectedBrandId);
    const sessionStartAt = getSessionStartAt({
      date: classSession.date,
      startTime: classSession.startTime,
    });
    if (isPastBookingCutoff(sessionStartAt, settings.endBookingPeriodHours)) {
      return NextResponse.json(
        {
          error:
            settings.endBookingPeriodHours === 0
              ? "Booking has closed for this session."
              : `Booking has closed for this session (closes ${settings.endBookingPeriodHours} hour(s) before start).`,
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== USER_ROLES.MEMBER) {
      return NextResponse.json({ error: "You must have a member account to book" }, { status: 400 });
    }

    const existingBooking = await prisma.booking.findUnique({
      where: {
        classSessionId_userId: {
          classSessionId: sessionId,
          userId,
        },
      },
    });

    if (existingBooking && existingBooking.status !== "CANCELLED") {
      return NextResponse.json({ error: "You are already booked for this session" }, { status: 400 });
    }

    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        membershipBrands: {
          select: { brandId: true },
        },
        product: {
          include: {
            productItems: {
              where: {
                itemId: classSession.itemId,
                isActive: true,
              },
              include: { quotaPool: true },
            },
          },
        },
        quotaUsage: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }
    const membershipBrandIds = membership.membershipBrands.map((mb) => mb.brandId);
    if (!membershipBrandIds.includes(selectedBrandId)) {
      return NextResponse.json({ error: "Membership does not belong to selected brand" }, { status: 400 });
    }

    if (membership.userId !== userId) {
      return NextResponse.json({ error: "Membership does not belong to you" }, { status: 400 });
    }

    if (membership.status !== "ACTIVE") {
      return NextResponse.json({ error: "Membership is not active" }, { status: 400 });
    }

    if (membership.expiredAt <= new Date()) {
      return NextResponse.json({ error: "Membership has expired" }, { status: 400 });
    }

    const productItem = membership.product.productItems[0] ?? null;

    if (!productItem) {
      return NextResponse.json({ error: "Your membership does not include this class type" }, { status: 400 });
    }

    const participantsPerPurchase = membership.product.participantsPerPurchase ?? 1;
    const { _sum } = await prisma.booking.aggregate({
      where: {
        classSessionId: sessionId,
        status: "CONFIRMED",
      },
      _sum: { participantCount: true },
    });
    const totalSlots = _sum?.participantCount ?? 0;
    const capacity = classSession.item.capacity;
    if (totalSlots + participantsPerPurchase > capacity) {
      const spotsLeft = Math.max(0, capacity - totalSlots);
      return NextResponse.json(
        {
          error:
            spotsLeft === 0
              ? "Session is at full capacity"
              : `This membership uses ${participantsPerPurchase} spot(s); only ${spotsLeft} spot(s) left in this session.`,
        },
        { status: 400 },
      );
    }

    if (!checkQuotaAvailability(productItem, membership.quotaUsage)) {
      return NextResponse.json({ error: "No remaining quota for this class" }, { status: 400 });
    }

    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          userId,
          classSessionId: sessionId,
          membershipId,
          brandId: classSession.brandId,
          participantCount: participantsPerPurchase,
          status: "CONFIRMED",
        },
        include: {
          classSession: {
            select: {
              id: true,
              date: true,
              startTime: true,
              endTime: true,
              item: {
                select: { id: true, name: true },
              },
            },
          },
          membership: {
            select: {
              id: true,
              product: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      await deductQuota({ tx, membershipId, productItem });

      return b;
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Error booking session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
