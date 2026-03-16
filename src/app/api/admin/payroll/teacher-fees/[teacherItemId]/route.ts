import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAdmin } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";

const updateSchema = z.object({
  feeAmount: z.number().int().min(0),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ teacherItemId: string }> }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { teacherItemId } = await params;
    const body = await request.json();
    const { feeAmount } = updateSchema.parse(body);

    const updated = await prisma.teacherItem.update({
      where: { id: teacherItemId },
      data: { feeAmount },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        item: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      id: updated.id,
      teacherId: updated.teacherId,
      itemId: updated.itemId,
      feeAmount: updated.feeAmount,
      teacher: updated.teacher,
      item: updated.item,
    });
  } catch (err) {
    return handleApiError(err, "Failed to update teacher fee");
  }
}
