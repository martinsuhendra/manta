import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { getItemWhereForBrandAccess, requireBrandAccess } from "@/lib/api-utils";
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

    if (![USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error, brandIds } = await requireBrandAccess(request);
    if (error) return error;
    const whereBrand = getItemWhereForBrandAccess(request, brandIds);

    const { searchParams } = new URL(request.url);
    const includeTeachers = searchParams.get("includeTeachers") === "true";
    const includeSchedules = searchParams.get("includeSchedules") === "true";

    const items = await prisma.item.findMany({
      where: whereBrand,
      include: {
        itemBrands: {
          select: {
            brandId: true,
            brand: { select: { id: true, name: true } },
          },
        },
        teacherItems: includeTeachers
          ? {
              select: {
                id: true,
                teacherId: true,
                itemId: true,
                teacherProfitPercent: true,
                isActive: true,
                createdAt: true,
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

    const payload = items.map((row) => ({
      ...row,
      brandIds: row.itemBrands.map((ib) => ib.brandId),
    }));

    return NextResponse.json(payload);
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

    if (![USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createItemSchema.parse(body);

    // Extract schedules from validated data
    const { schedules, brandIds, ...itemData } = validatedData;

    const brands = await prisma.brand.findMany({
      where: { id: { in: brandIds } },
      select: { id: true },
    });
    if (brands.length !== brandIds.length) {
      return NextResponse.json({ error: "One or more stores not found" }, { status: 400 });
    }

    const item = await prisma.item.create({
      data: {
        ...itemData,
        itemBrands: {
          create: brandIds.map((brandId) => ({ brandId })),
        },
      },
      include: {
        schedules: true,
        itemBrands: {
          select: {
            brandId: true,
            brand: { select: { id: true, name: true } },
          },
        },
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
          itemBrands: {
            select: {
              brandId: true,
              brand: { select: { id: true, name: true } },
            },
          },
          _count: {
            select: {
              teacherItems: true,
              schedules: true,
              classSessions: true,
            },
          },
        },
      });

      if (!updatedItem) {
        return NextResponse.json({ error: "Failed to load created item" }, { status: 500 });
      }

      return NextResponse.json(
        {
          ...updatedItem,
          brandIds: updatedItem.itemBrands.map((ib) => ib.brandId),
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        ...item,
        brandIds: item.itemBrands.map((ib) => ib.brandId),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating item:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
