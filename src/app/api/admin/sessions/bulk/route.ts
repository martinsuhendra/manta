import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAdmin } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";

import { generateAutomaticSessions, generateManualSessions, calculateEndTime } from "./session-helpers";

const bulkSessionSchema = z.object({
  mode: z.enum(["AUTOMATIC", "MANUAL"]),
  startDate: z.string(),
  endDate: z.string(),
  itemIds: z.array(z.string()).min(1, "At least one class must be selected"),
  manualSessions: z
    .array(
      z.object({
        itemId: z.string(),
        teacherId: z.string().optional(),
        date: z.string(),
        startTime: z.string(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const validatedData = bulkSessionSchema.parse(body);

    const { mode, startDate, endDate, itemIds, manualSessions } = validatedData;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 });
    }

    // Fetch items with their schedules
    const items = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      include: {
        schedules: {
          where: { isActive: true },
        },
      },
    });

    if (items.length === 0) {
      return NextResponse.json({ error: "No valid items found" }, { status: 404 });
    }

    // Generate sessions based on mode
    let sessionsToCreate: Array<{
      itemId: string;
      teacherId: string | null;
      date: Date;
      startTime: string;
      endTime: string;
      status: "SCHEDULED";
      notes: string | null;
    }> = [];

    if (mode === "AUTOMATIC") {
      sessionsToCreate = generateAutomaticSessions(items, start, end, calculateEndTime);
    } else {
      // Manual mode - use provided sessions
      if (!manualSessions || manualSessions.length === 0) {
        return NextResponse.json({ error: "Manual sessions are required in manual mode" }, { status: 400 });
      }
      sessionsToCreate = generateManualSessions(manualSessions, items, start, end, calculateEndTime);
    }

    if (sessionsToCreate.length === 0) {
      return NextResponse.json({ error: "No sessions to create" }, { status: 400 });
    }

    // Check for duplicates and filter them out
    const existingSessions = await prisma.classSession.findMany({
      where: {
        OR: sessionsToCreate.map((session) => ({
          itemId: session.itemId,
          date: session.date,
          startTime: session.startTime,
        })),
      },
      select: {
        itemId: true,
        date: true,
        startTime: true,
      },
    });

    const existingKeys = new Set(
      existingSessions.map((s) => `${s.itemId}-${s.date.toISOString().split("T")[0]}-${s.startTime}`),
    );

    const uniqueSessions = sessionsToCreate.filter(
      (session) =>
        !existingKeys.has(`${session.itemId}-${session.date.toISOString().split("T")[0]}-${session.startTime}`),
    );

    if (uniqueSessions.length === 0) {
      return NextResponse.json(
        {
          error: "All sessions already exist",
          skipped: sessionsToCreate.length,
        },
        { status: 400 },
      );
    }

    // Create sessions in batches to avoid overwhelming the database
    const batchSize = 100;
    const createdSessions = [];

    for (let i = 0; i < uniqueSessions.length; i += batchSize) {
      const batch = uniqueSessions.slice(i, i + batchSize);
      const result = await prisma.classSession.createMany({
        data: batch,
        skipDuplicates: true,
      });
      createdSessions.push(...batch.slice(0, result.count));
    }

    return NextResponse.json(
      {
        message: "Bulk sessions created successfully",
        created: uniqueSessions.length,
        skipped: sessionsToCreate.length - uniqueSessions.length,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Failed to create bulk sessions");
  }
}
