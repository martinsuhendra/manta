/* eslint-disable complexity, @typescript-eslint/no-unnecessary-condition */
import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
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

    const userId = session.user.id;
    const { id: sessionId } = await params;
    const body = await request.json();
    const { membershipId } = bookSchema.parse(body);

    const classSession = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        item: true,
        _count: {
          select: {
            bookings: {
              where: { status: { not: "CANCELLED" } },
            },
          },
        },
      },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (classSession.status !== "SCHEDULED") {
      return NextResponse.json({ error: "Session is not available for booking" }, { status: 400 });
    }

    if (classSession._count.bookings >= classSession.item.capacity) {
      return NextResponse.json({ error: "Session is at full capacity" }, { status: 400 });
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

    if (productItem.quotaType === "INDIVIDUAL") {
      const quotaUsage = membership.quotaUsage.find((u) => u.productItemId === productItem.id);
      const usedCount = quotaUsage?.usedCount ?? 0;
      const quotaValue = productItem.quotaValue ?? 0;
      if (usedCount >= quotaValue) {
        return NextResponse.json({ error: "No remaining quota for this class" }, { status: 400 });
      }
    } else if (productItem.quotaType === "SHARED" && productItem.quotaPoolId) {
      const quotaUsage = membership.quotaUsage.find((u) => u.quotaPoolId === productItem.quotaPoolId);
      const usedCount = quotaUsage?.usedCount ?? 0;
      const totalQuota = productItem.quotaPool?.totalQuota ?? 0;
      if (usedCount >= totalQuota) {
        return NextResponse.json({ error: "No remaining quota in pool" }, { status: 400 });
      }
    }

    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          userId,
          classSessionId: sessionId,
          membershipId,
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

      if (productItem.quotaType === "INDIVIDUAL") {
        await tx.membershipQuotaUsage.upsert({
          where: {
            membershipId_productItemId: {
              membershipId,
              productItemId: productItem.id,
            },
          },
          create: {
            membershipId,
            productItemId: productItem.id,
            usedCount: 1,
          },
          update: {
            usedCount: { increment: 1 },
          },
        });
      } else if (productItem.quotaType === "SHARED" && productItem.quotaPoolId) {
        await tx.membershipQuotaUsage.upsert({
          where: {
            membershipId_quotaPoolId: {
              membershipId,
              quotaPoolId: productItem.quotaPoolId,
            },
          },
          create: {
            membershipId,
            quotaPoolId: productItem.quotaPoolId,
            usedCount: 1,
          },
          update: {
            usedCount: { increment: 1 },
          },
        });
      }

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
