import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

import { createItemSchema } from "../../../(main)/dashboard/admin/items/_components/schema";

// Helper function to calculate end time based on start time and duration
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + durationMinutes;

  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;

  return `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeTeachers = searchParams.get("includeTeachers") === "true";
    const includeSchedules = searchParams.get("includeSchedules") === "true";

    const items = await prisma.item.findMany({
      include: {
        teacherItems: includeTeachers
          ? {
              include: {
                teacher: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            }
          : false,
        schedules: includeSchedules,
        _count: {
          select: {
            teacherItems: true,
            schedules: true,
            classSessions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createItemSchema.parse(body);

    // Extract schedules from validated data
    const { schedules, ...itemData } = validatedData;

    const item = await prisma.item.create({
      data: itemData,
      include: {
        schedules: true,
        _count: {
          select: {
            teacherItems: true,
            schedules: true,
            classSessions: true,
          },
        },
      },
    });

    // Create schedules if any are provided
    if (schedules.length > 0) {
      await prisma.itemSchedule.createMany({
        data: schedules.map((schedule) => ({
          ...schedule,
          itemId: item.id,
          // Provide default endTime if not specified (duration-based calculation)
          endTime: schedule.endTime || calculateEndTime(schedule.startTime, itemData.duration),
        })),
      });

      // Fetch the updated item with schedules
      const updatedItem = await prisma.item.findUnique({
        where: { id: item.id },
        include: {
          schedules: true,
          _count: {
            select: {
              teacherItems: true,
              schedules: true,
              classSessions: true,
            },
          },
        },
      });

      return NextResponse.json(updatedItem, { status: 201 });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
