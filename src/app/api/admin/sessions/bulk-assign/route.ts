import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAdmin } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

const bulkAssignSchema = z.object({
  sessionIds: z.array(z.string().min(1)).min(1, "At least one session is required"),
  teacherId: z.string().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const validatedData = bulkAssignSchema.parse(body);

    const { sessionIds, teacherId } = validatedData;

    if (teacherId) {
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
        select: { role: true },
      });
      if (!teacher || teacher.role !== USER_ROLES.TEACHER) {
        return NextResponse.json({ error: "Selected user must have TEACHER role" }, { status: 400 });
      }
    }

    await prisma.classSession.updateMany({
      where: { id: { in: sessionIds } },
      data: { teacherId },
    });

    return NextResponse.json({ success: true, updated: sessionIds.length });
  } catch (err) {
    return handleApiError(err, "Failed to bulk assign teacher");
  }
}
