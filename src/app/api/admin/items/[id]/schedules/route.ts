import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

import { createItemScheduleSchema } from "../../../../../(main)/dashboard/admin/items/_components/schema";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const schedules = await prisma.itemSchedule.findMany({
      where: { itemId: id },
      include: {
        item: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        {
          dayOfWeek: "asc",
        },
        {
          startTime: "asc",
        },
      ],
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching item schedules:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = createItemScheduleSchema.parse({
      ...body,
      itemId: id,
    });

    // Validate time range
    const timeValidation = validateTimeRange(validatedData.startTime, validatedData.endTime);
    if (!timeValidation.isValid) {
      return NextResponse.json({ error: timeValidation.error }, { status: 400 });
    }

    // Check for overlapping schedules
    const existingSchedules = await prisma.itemSchedule.findMany({
      where: {
        itemId: id,
        dayOfWeek: validatedData.dayOfWeek,
        isActive: true,
      },
    });

    const overlapCheck = checkScheduleOverlap(
      timeValidation.startTimeMinutes!,
      timeValidation.endTimeMinutes!,
      existingSchedules,
    );

    if (overlapCheck.hasOverlap) {
      return NextResponse.json({ error: overlapCheck.error }, { status: 400 });
    }

    const schedule = await prisma.itemSchedule.create({
      data: validatedData,
      include: {
        item: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Error creating item schedule:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to convert time string to minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Helper function to validate time range
function validateTimeRange(startTime: string, endTime: string) {
  const startTimeMinutes = timeToMinutes(startTime);
  const endTimeMinutes = timeToMinutes(endTime);

  if (startTimeMinutes >= endTimeMinutes) {
    return { isValid: false, error: "Start time must be before end time" };
  }

  return { isValid: true, startTimeMinutes, endTimeMinutes };
}

// Helper function to check for schedule overlaps
function checkScheduleOverlap(
  newStartMinutes: number,
  newEndMinutes: number,
  existingSchedules: Array<{ startTime: string; endTime: string }>,
) {
  for (const schedule of existingSchedules) {
    const existingStart = timeToMinutes(schedule.startTime);
    const existingEnd = timeToMinutes(schedule.endTime);

    if (
      (newStartMinutes >= existingStart && newStartMinutes < existingEnd) ||
      (newEndMinutes > existingStart && newEndMinutes <= existingEnd) ||
      (newStartMinutes <= existingStart && newEndMinutes >= existingEnd)
    ) {
      return { hasOverlap: true, error: "Schedule overlaps with existing schedule" };
    }
  }

  return { hasOverlap: false };
}
