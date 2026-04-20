/* eslint-disable complexity */
import { NextRequest, NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { getBrandFilterFromRequest, requireBrandAccess } from "@/lib/api-utils";
import { doesBookingStatusConsumeQuota } from "@/lib/booking-status";
import { prisma } from "@/lib/generated/prisma";
import { sumParticipantSlots } from "@/lib/session-utils";
import { USER_ROLES } from "@/lib/types";

const ALLOWED_SESSION_STATUS = new Set(["SCHEDULED", "CANCELLED", "COMPLETED"]);
const ALLOWED_SESSION_VISIBILITY = new Set(["PUBLIC", "PRIVATE"]);

function parseDateOrNull(raw: string | null): Date | null {
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export async function GET(request: NextRequest) {
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

    const { error, brandIds } = await requireBrandAccess(request);
    if (error) return error;
    const whereBrand = getBrandFilterFromRequest(request, brandIds);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const teacherId = searchParams.get("teacherId");
    const itemId = searchParams.get("itemId");
    const status = searchParams.get("status");
    const visibility = searchParams.get("visibility");

    // Build filter conditions (asserted when passed to Prisma)
    const whereConditions: Record<string, unknown> = {};

    const parsedStartDate = parseDateOrNull(startDate);
    const parsedEndDate = parseDateOrNull(endDate);

    if (startDate && !parsedStartDate) {
      return NextResponse.json({ error: "Invalid startDate" }, { status: 400 });
    }
    if (endDate && !parsedEndDate) {
      return NextResponse.json({ error: "Invalid endDate" }, { status: 400 });
    }

    if (parsedStartDate && parsedEndDate) {
      const start = parsedStartDate;
      const end = parsedEndDate;

      // Enforce maximum 30-day range
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 30) {
        // If range exceeds 30 days, limit to 30 days from start
        const maxEnd = new Date(start);
        maxEnd.setDate(maxEnd.getDate() + 30);
        whereConditions.date = {
          gte: start,
          lte: maxEnd,
        };
      } else {
        whereConditions.date = {
          gte: start,
          lte: end,
        };
      }
    } else if (parsedStartDate) {
      const start = parsedStartDate;
      // If only start date provided, default to 30 days from start
      const defaultEnd = new Date(start);
      defaultEnd.setDate(defaultEnd.getDate() + 30);
      whereConditions.date = {
        gte: start,
        lte: defaultEnd,
      };
    } else if (parsedEndDate) {
      whereConditions.date = {
        lte: parsedEndDate,
      };
    } else {
      // Default: show next 30 days from today if no date filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const defaultEnd = new Date(today);
      defaultEnd.setDate(defaultEnd.getDate() + 30);
      whereConditions.date = {
        gte: today,
        lte: defaultEnd,
      };
    }

    const isTeacher = session.user.role === USER_ROLES.TEACHER;

    if (!isTeacher && teacherId) {
      if (teacherId === "unassigned") {
        whereConditions.teacherId = null;
      } else {
        whereConditions.teacherId = teacherId;
      }
    }

    if (itemId) {
      whereConditions.itemId = itemId;
    }

    if (status && ALLOWED_SESSION_STATUS.has(status)) {
      whereConditions.status = status;
    }
    if (visibility && ALLOWED_SESSION_VISIBILITY.has(visibility)) {
      whereConditions.visibility = visibility;
    }
    if (isTeacher) {
      if (visibility === "PRIVATE") {
        whereConditions.visibility = "PRIVATE";
        whereConditions.teacherId = session.user.id;
      } else if (visibility === "PUBLIC") {
        whereConditions.visibility = "PUBLIC";
      } else {
        whereConditions.OR = [{ visibility: "PUBLIC" }, { teacherId: session.user.id }];
      }
    }

    const sessions = await prisma.classSession.findMany({
      where: { ...whereBrand, ...whereConditions } as Prisma.ClassSessionWhereInput,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            duration: true,
            capacity: true,
            color: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
        bookings: {
          select: { participantCount: true, status: true },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    const sessionsWithSlots = sessions.map((s) => {
      const { bookings, ...rest } = s;
      const occupiedBookings = bookings.filter((booking) => doesBookingStatusConsumeQuota(booking.status));
      return { ...rest, totalParticipantSlots: sumParticipantSlots(occupiedBookings) };
    });

    return NextResponse.json(sessionsWithSlots);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { itemId, teacherId, date, startTime, status, notes, visibility } = body;

    // Validate required fields
    if (!itemId || !date || !startTime) {
      return NextResponse.json({ error: "Missing required fields: itemId, date, startTime" }, { status: 400 });
    }

    // Validate that the item exists and get its duration
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Calculate end time based on start time + item duration
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const startTimeInMinutes = startHours * 60 + startMinutes;
    const endTimeInMinutes = startTimeInMinutes + item.duration;

    const endHours = Math.floor(endTimeInMinutes / 60);
    const endMins = endTimeInMinutes % 60;
    const calculatedEndTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;

    // If teacher is provided, validate that the teacher exists and has TEACHER role
    if (teacherId) {
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
      });

      if (!teacher) {
        return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
      }

      if (teacher.role !== USER_ROLES.TEACHER) {
        return NextResponse.json({ error: "Selected user must have TEACHER role" }, { status: 400 });
      }
    }

    // Check for duplicate sessions (same item, date, and start time)
    const existingSession = await prisma.classSession.findUnique({
      where: {
        itemId_date_startTime: {
          itemId,
          date: new Date(date),
          startTime,
        },
      },
    });

    if (existingSession) {
      return NextResponse.json(
        { error: "A session already exists for this item at this date and time" },
        { status: 409 },
      );
    }

    const brandId = request.headers.get("x-brand-id");
    if (!brandId || brandId === "ALL") {
      return NextResponse.json({ error: "Select a single brand to create a session" }, { status: 400 });
    }

    const itemAtStore = await prisma.itemBrand.findFirst({
      where: { itemId, brandId },
    });
    if (!itemAtStore) {
      return NextResponse.json({ error: "This class is not offered at the selected store" }, { status: 400 });
    }

    const newSession = await prisma.classSession.create({
      data: {
        itemId,
        brandId,
        teacherId: teacherId || null,
        date: new Date(date),
        startTime,
        endTime: calculatedEndTime,
        status: status || "SCHEDULED",
        visibility: visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
        notes: notes || null,
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            duration: true,
            capacity: true,
            color: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
