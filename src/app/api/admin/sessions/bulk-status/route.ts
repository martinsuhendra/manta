import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAdmin } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";

const bulkStatusSchema = z.object({
  sessionIds: z.array(z.string().min(1)).min(1, "At least one session is required"),
  status: z.enum(["SCHEDULED", "CANCELLED", "COMPLETED"]),
});

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { sessionIds, status } = bulkStatusSchema.parse(body);
    const uniqueSessionIds = Array.from(new Set(sessionIds));

    const sessions = await prisma.classSession.findMany({
      where: {
        id: {
          in: uniqueSessionIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (sessions.length !== uniqueSessionIds.length) {
      return NextResponse.json({ error: "One or more sessions were not found" }, { status: 404 });
    }

    const result = await prisma.classSession.updateMany({
      where: {
        id: {
          in: uniqueSessionIds,
        },
      },
      data: {
        status,
      },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      status,
    });
  } catch (error) {
    return handleApiError(error, "Failed to bulk update session status");
  }
}
