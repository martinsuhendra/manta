import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string; membershipId: string }> }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id: userId, membershipId } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
    const pageSize = Math.min(parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);

    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, userId },
      select: {
        id: true,
        status: true,
        joinDate: true,
        expiredAt: true,
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Membership not found for this user" }, { status: 404 });
    }

    const whereClause = {
      userId,
      membershipId,
    };

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where: whereClause }),
      prisma.booking.findMany({
        where: whereClause,
        orderBy: [{ classSession: { date: "desc" } }, { classSession: { startTime: "desc" } }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          status: true,
          participantCount: true,
          createdAt: true,
          classSession: {
            select: {
              id: true,
              date: true,
              startTime: true,
              endTime: true,
              status: true,
              item: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      membership,
      items: bookings,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    console.error("Failed to fetch membership attendances:", error);
    return NextResponse.json({ error: "Failed to fetch membership attendances" }, { status: 500 });
  }
}
