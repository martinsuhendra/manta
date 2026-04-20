/* eslint-disable complexity, @typescript-eslint/no-unnecessary-condition */
import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { doesBookingStatusConsumeQuota, getCapacityBookingStatuses } from "@/lib/booking-status";
import { emailService } from "@/lib/email/service";
import { createSessionJoinedTemplate, createSessionWaitlistedTemplate } from "@/lib/email/templates";
import { prisma } from "@/lib/generated/prisma";
import { calculateRemainingQuota, deductQuota } from "@/lib/quota-utils";
import { resolveEligibleMembershipsForItem } from "@/lib/session-booking-eligibility";
import { USER_ROLES } from "@/lib/types";

const addParticipantSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  membershipId: z.string().uuid("Invalid membership ID"),
});

const updateBookingStatusesSchema = z.object({
  bookingIds: z.array(z.string().uuid("Invalid booking ID")).min(1, "At least one booking ID is required"),
  targetStatus: z.literal("CONFIRMED"),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      ![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER, USER_ROLES.TEACHER].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: sessionId } = await params;

    // Get session details with item
    const classSession = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        item: true,
      },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.user.role === USER_ROLES.TEACHER && classSession.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all members with their active memberships
    const members = await prisma.user.findMany({
      where: {
        role: USER_ROLES.MEMBER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        memberships: {
          where: {
            status: "ACTIVE",
            expiredAt: {
              gt: new Date(),
            },
          },
          include: {
            product: {
              include: {
                productItems: {
                  where: {
                    itemId: classSession.itemId,
                    isActive: true,
                  },
                  include: {
                    quotaPool: true,
                  },
                },
              },
            },
            quotaUsage: true,
          },
        },
      },
    });

    const eligibleMembers = members.map((member) => ({
      ...member,
      memberships: member.memberships.map((membership) => {
        const productItem = membership.product.productItems[0] ?? null;

        if (!productItem) {
          return {
            ...membership,
            isEligible: false,
            reason: "Membership does not include this class type",
            remainingQuota: 0,
          };
        }

        const remaining = calculateRemainingQuota(productItem, membership.quotaUsage);
        const isEligible = remaining > 0;

        return {
          id: membership.id,
          userId: membership.userId,
          productId: membership.productId,
          status: membership.status,
          expiredAt: membership.expiredAt,
          product: {
            id: membership.product.id,
            name: membership.product.name,
          },
          isEligible,
          reason: isEligible ? "" : "No remaining quota for this class",
          remainingQuota: remaining === Infinity ? null : remaining,
        };
      }),
    }));

    return NextResponse.json(eligibleMembers);
  } catch (error) {
    console.error("Error fetching eligible members:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: sessionId } = await params;
    const body = await request.json();
    const validatedData = addParticipantSchema.parse(body);
    const { userId, membershipId } = validatedData;

    // Check if session exists
    const classSession = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        item: true,
        teacher: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    // Check if user exists and has MEMBER role
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== USER_ROLES.MEMBER) {
      return NextResponse.json({ error: "User must have MEMBER role" }, { status: 400 });
    }

    // Check if user is already booked
    const existingBooking = await prisma.booking.findUnique({
      where: {
        classSessionId_userId: {
          classSessionId: sessionId,
          userId,
        },
      },
    });

    if (existingBooking) {
      return NextResponse.json({ error: "Member is already booked for this session" }, { status: 400 });
    }

    const eligibleMemberships = await resolveEligibleMembershipsForItem({
      userId,
      itemId: classSession.itemId,
      brandId: classSession.brandId,
    });
    const selectedMembership = eligibleMemberships.find((membership) => membership.id === membershipId);
    if (!selectedMembership) {
      return NextResponse.json({ error: "Selected membership is not eligible for this class" }, { status: 400 });
    }

    const participantsPerPurchase = selectedMembership.slotsRequired;
    const { _sum } = await prisma.booking.aggregate({
      where: {
        classSessionId: sessionId,
        status: { in: getCapacityBookingStatuses() },
      },
      _sum: { participantCount: true },
    });
    const totalSlots = _sum?.participantCount ?? 0;
    const capacity = classSession.item.capacity;
    const isAtCapacity = totalSlots + participantsPerPurchase > capacity;
    const existingActiveBookings = await prisma.booking.count({
      where: {
        classSessionId: sessionId,
        status: { in: getCapacityBookingStatuses() },
      },
    });

    if (classSession.visibility === "PRIVATE") {
      if (existingActiveBookings > 0) {
        return NextResponse.json({ error: "Private session already has an appointed member" }, { status: 400 });
      }
      if (isAtCapacity) {
        return NextResponse.json({ error: "Private session is at full capacity" }, { status: 400 });
      }
    }

    // Create booking and update quota usage in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Determine booking status based on capacity
      const bookingStatus =
        classSession.visibility === "PRIVATE" ? "CONFIRMED" : isAtCapacity ? "WAITLISTED" : "RESERVED";

      // Create booking
      const booking = await tx.booking.create({
        data: {
          userId,
          classSessionId: sessionId,
          membershipId,
          brandId: classSession.brandId,
          participantCount: participantsPerPurchase,
          status: bookingStatus,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          membership: {
            select: {
              id: true,
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (doesBookingStatusConsumeQuota(bookingStatus)) {
        await deductQuota({ tx, membershipId, productItem: selectedMembership.productItem });
      }

      return booking;
    });

    // Send email notification to the newly added participant
    if (result.user.email) {
      try {
        const sessionInfo = {
          itemName: classSession.item.name,
          date: classSession.date.toISOString(),
          startTime: classSession.startTime,
          endTime: classSession.endTime,
          teacher: classSession.teacher
            ? {
                name: classSession.teacher.name,
                email: classSession.teacher.email,
              }
            : null,
          notes: classSession.notes,
        };

        if (result.status === "WAITLISTED") {
          // Send waitlist confirmation email
          const emailTemplate = createSessionWaitlistedTemplate(sessionInfo, result.user.name || result.user.email);
          await emailService.sendEmail(result.user.email, emailTemplate);
        } else {
          // Send regular joined email
          const emailTemplate = createSessionJoinedTemplate(sessionInfo, result.user.name || result.user.email);
          await emailService.sendEmail(result.user.email, emailTemplate);
        }
      } catch (emailError) {
        console.error("Failed to send session email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }

    console.error("Error adding participant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: sessionId } = await params;
    const body = await request.json();
    const { bookingIds } = updateBookingStatusesSchema.parse(body);

    const classSession = await prisma.classSession.findUnique({
      where: { id: sessionId },
      select: { id: true, teacherId: true },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const updateResult = await prisma.booking.updateMany({
      where: {
        classSessionId: sessionId,
        id: { in: bookingIds },
        status: "RESERVED",
      },
      data: {
        status: "CONFIRMED",
      },
    });

    const updatedCount = updateResult.count;
    const skippedCount = bookingIds.length - updatedCount;

    return NextResponse.json({
      success: true,
      updatedCount,
      skippedCount,
      message: `Updated ${updatedCount} booking(s) to CONFIRMED.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }

    console.error("Error updating booking statuses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
