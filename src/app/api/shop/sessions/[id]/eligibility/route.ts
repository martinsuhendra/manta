/* eslint-disable complexity, @typescript-eslint/no-unnecessary-condition */
import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.MEMBER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = session.user.id;
    const { id: sessionId } = await params;

    const classSession = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { item: true },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (classSession.status !== "SCHEDULED") {
      return NextResponse.json({ canJoin: false, reason: "Session is not available for booking" }, { status: 200 });
    }

    const existingBooking = await prisma.booking.findUnique({
      where: {
        classSessionId_userId: {
          classSessionId: sessionId,
          userId,
        },
      },
    });

    const alreadyBooked = !!existingBooking && existingBooking.status !== "CANCELLED";
    const bookingId = alreadyBooked ? existingBooking.id : undefined;

    if (alreadyBooked) {
      return NextResponse.json({
        canJoin: false,
        alreadyBooked: true,
        bookingId,
        eligibleMemberships: [],
        reason: "You are already booked for this session",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        memberships: {
          where: {
            status: "ACTIVE",
            expiredAt: { gt: new Date() },
          },
          include: {
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
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const eligibleMemberships: Array<{
      id: string;
      product: { name: string };
      remainingQuota: number | null;
      isEligible: true;
    }> = [];
    let reason = "";

    for (const membership of user.memberships) {
      const productItem = membership.product.productItems[0] ?? null;

      if (!productItem) {
        if (user.memberships.length === 1) {
          reason = "Your membership does not include this class type";
        }
        continue;
      }

      let remainingQuota: number = Infinity;
      let isEligible = true;

      if (productItem.quotaType === "FREE") {
        remainingQuota = Infinity;
      } else if (productItem.quotaType === "INDIVIDUAL") {
        const quotaUsage = membership.quotaUsage.find((u) => u.productItemId === productItem.id);
        const usedCount = quotaUsage?.usedCount ?? 0;
        remainingQuota = (productItem.quotaValue ?? 0) - usedCount;
        isEligible = remainingQuota > 0;
      } else if (productItem.quotaType === "SHARED" && productItem.quotaPoolId) {
        const quotaUsage = membership.quotaUsage.find((u) => u.quotaPoolId === productItem.quotaPoolId);
        const usedCount = quotaUsage?.usedCount ?? 0;
        remainingQuota = (productItem.quotaPool?.totalQuota ?? 0) - usedCount;
        isEligible = remainingQuota > 0;
      }

      if (!isEligible) {
        if (user.memberships.length === 1) {
          reason = "No remaining quota for this class";
        }
        continue;
      }

      eligibleMemberships.push({
        id: membership.id,
        product: { name: membership.product.name },
        remainingQuota: remainingQuota === Infinity ? null : remainingQuota,
        isEligible: true,
      });
    }

    if (eligibleMemberships.length === 0) {
      if (!reason) {
        reason =
          user.memberships.length === 0
            ? "You need an active membership to book this class"
            : "No eligible membership for this class";
      }
      return NextResponse.json({
        canJoin: false,
        alreadyBooked: false,
        eligibleMemberships: [],
        reason,
      });
    }

    return NextResponse.json({
      canJoin: true,
      alreadyBooked: false,
      eligibleMemberships,
    });
  } catch (error) {
    console.error("Error fetching session eligibility:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
