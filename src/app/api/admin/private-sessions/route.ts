/* eslint-disable complexity */
import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { requireBrandAccess } from "@/lib/api-utils";
import { getCapacityBookingStatuses } from "@/lib/booking-status";
import { prisma } from "@/lib/generated/prisma";
import { deductQuota } from "@/lib/quota-utils";
import { RBAC_PRIVATE_SESSION_ADMIN_ROLES } from "@/lib/rbac";
import { resolveEligibleMembershipsForItem } from "@/lib/session-booking-eligibility";
import { USER_ROLES } from "@/lib/types";

const privateSessionSchema = z.object({
  userId: z.string().uuid("Invalid member ID"),
  itemId: z.string().uuid("Invalid class ID"),
  membershipId: z.string().uuid("Invalid membership ID"),
  teacherId: z.string().uuid("Invalid teacher ID").optional().nullable(),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  notes: z.string().optional().nullable(),
});

const eligibilityQuerySchema = z.object({
  userId: z.string().uuid("Invalid member ID"),
  itemId: z.string().uuid("Invalid class ID"),
});

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + durationMinutes;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  return `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
}

function ensureCreatorRole(role: string): boolean {
  return RBAC_PRIVATE_SESSION_ADMIN_ROLES.includes(role);
}

function resolveTeacherId({
  actorRole,
  actorUserId,
  requestedTeacherId,
}: {
  actorRole: string;
  actorUserId: string;
  requestedTeacherId: string | null;
}): string | null {
  if (actorRole !== USER_ROLES.TEACHER) return requestedTeacherId;
  if (!requestedTeacherId) return actorUserId;
  if (requestedTeacherId === actorUserId) return requestedTeacherId;
  return null;
}

function getSelectedBrandId(request: NextRequest): string | null {
  const selectedBrandId = request.headers.get("x-brand-id");
  if (!selectedBrandId || selectedBrandId === "ALL") return null;
  return selectedBrandId;
}

export async function GET(request: NextRequest) {
  try {
    const access = await requireBrandAccess(request);
    if (access.error) return access.error;

    if (!access.session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!ensureCreatorRole(access.session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const selectedBrandId = getSelectedBrandId(request);
    if (!selectedBrandId) {
      return NextResponse.json({ error: "Select a single brand first" }, { status: 400 });
    }

    const parsedQuery = eligibilityQuerySchema.safeParse({
      userId: request.nextUrl.searchParams.get("userId"),
      itemId: request.nextUrl.searchParams.get("itemId"),
    });
    if (!parsedQuery.success) {
      return NextResponse.json({ error: "Validation failed", details: parsedQuery.error.errors }, { status: 400 });
    }

    const { userId, itemId } = parsedQuery.data;
    const [member, itemAtBrand] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, name: true, email: true },
      }),
      prisma.itemBrand.findFirst({
        where: { itemId, brandId: selectedBrandId },
        select: { itemId: true },
      }),
    ]);

    if (!member || member.role !== USER_ROLES.MEMBER) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (!itemAtBrand) {
      return NextResponse.json({ error: "Selected class is not offered in this brand" }, { status: 400 });
    }

    const memberships = await resolveEligibleMembershipsForItem({
      userId,
      itemId,
      brandId: selectedBrandId,
    });

    return NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
      },
      memberships: memberships.map((membership) => ({
        id: membership.id,
        productId: membership.productId,
        productName: membership.productName,
        expiredAt: membership.expiredAt.toISOString(),
        slotsRequired: membership.slotsRequired,
        remainingQuota: membership.remainingQuota,
      })),
    });
  } catch (error) {
    console.error("Error getting private session eligibility:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireBrandAccess(request);
    if (access.error) return access.error;

    if (!access.session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!ensureCreatorRole(access.session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const selectedBrandId = getSelectedBrandId(request);
    if (!selectedBrandId) {
      return NextResponse.json({ error: "Select a single brand first" }, { status: 400 });
    }

    const parsedBody = privateSessionSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Validation failed", details: parsedBody.error.errors }, { status: 400 });
    }

    const data = parsedBody.data;
    const teacherId = resolveTeacherId({
      actorRole: access.session.user.role,
      actorUserId: access.session.user.id,
      requestedTeacherId: data.teacherId ?? null,
    });
    if (access.session.user.role === USER_ROLES.TEACHER && !teacherId) {
      return NextResponse.json({ error: "Teachers can only create private sessions for themselves" }, { status: 403 });
    }

    const [member, item, itemAtBrand] = await Promise.all([
      prisma.user.findUnique({
        where: { id: data.userId },
        select: { id: true, role: true, name: true, email: true },
      }),
      prisma.item.findUnique({
        where: { id: data.itemId },
        select: { id: true, name: true, duration: true, capacity: true },
      }),
      prisma.itemBrand.findFirst({
        where: { itemId: data.itemId, brandId: selectedBrandId },
        select: { itemId: true },
      }),
    ]);

    if (!member || member.role !== USER_ROLES.MEMBER) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (!item) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    if (!itemAtBrand) {
      return NextResponse.json({ error: "Selected class is not offered in this brand" }, { status: 400 });
    }

    if (teacherId) {
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
        select: { id: true, role: true },
      });
      if (!teacher || teacher.role !== USER_ROLES.TEACHER) {
        return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
      }
    }

    const eligibleMemberships = await resolveEligibleMembershipsForItem({
      userId: data.userId,
      itemId: data.itemId,
      brandId: selectedBrandId,
    });
    const selectedMembership = eligibleMemberships.find((membership) => membership.id === data.membershipId);
    if (!selectedMembership) {
      return NextResponse.json({ error: "Selected membership is not eligible for this class" }, { status: 400 });
    }

    const startDate = new Date(data.date);
    const endTime = calculateEndTime(data.startTime, item.duration);
    const requiredSlots = selectedMembership.slotsRequired;

    const existingSession = await prisma.classSession.findUnique({
      where: {
        itemId_date_startTime: {
          itemId: data.itemId,
          date: startDate,
          startTime: data.startTime,
        },
      },
      select: { id: true },
    });
    if (existingSession) {
      return NextResponse.json(
        { error: "A session already exists for this class at this date and time" },
        { status: 409 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const classSession = await tx.classSession.create({
        data: {
          itemId: data.itemId,
          teacherId: teacherId ?? null,
          brandId: selectedBrandId,
          date: startDate,
          startTime: data.startTime,
          endTime,
          status: "SCHEDULED",
          visibility: "PRIVATE",
          notes: data.notes ?? null,
        },
      });

      const { _sum } = await tx.booking.aggregate({
        where: {
          classSessionId: classSession.id,
          status: { in: getCapacityBookingStatuses() },
        },
        _sum: { participantCount: true },
      });
      const usedSlots = _sum.participantCount ?? 0;
      if (usedSlots + requiredSlots > item.capacity) {
        throw new Error("Private session is at full capacity");
      }

      const booking = await tx.booking.create({
        data: {
          userId: data.userId,
          classSessionId: classSession.id,
          membershipId: data.membershipId,
          brandId: selectedBrandId,
          participantCount: requiredSlots,
          status: "CHECKED_IN",
        },
      });

      await deductQuota({
        tx,
        membershipId: data.membershipId,
        productItem: selectedMembership.productItem,
      });

      return { classSession, booking };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Private session is at full capacity") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error creating private session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
