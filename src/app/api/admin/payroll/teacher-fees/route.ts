import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAdmin } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

const createTeacherFeeSchema = z.object({
  teacherId: z.string().uuid(),
  itemId: z.string().uuid(),
  feeAmount: z.number().int().min(0),
});

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId") || undefined;
    const itemId = searchParams.get("itemId") || undefined;

    const teacherItems = await prisma.teacherItem.findMany({
      where: {
        ...(teacherId && { teacherId }),
        ...(itemId && { itemId }),
      },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        item: { select: { id: true, name: true } },
      },
      orderBy: [{ teacherId: "asc" }, { itemId: "asc" }],
    });

    const rows = teacherItems.map((ti) => ({
      id: ti.id,
      teacherId: ti.teacherId,
      itemId: ti.itemId,
      feeAmount: ti.feeAmount,
      teacher: ti.teacher,
      item: ti.item,
    }));

    return NextResponse.json(rows);
  } catch (err) {
    return handleApiError(err, "Failed to fetch teacher fees");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { teacherId, itemId, feeAmount } = createTeacherFeeSchema.parse(body);

    const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }
    if (teacher.role !== USER_ROLES.TEACHER) {
      return NextResponse.json({ error: "User must have TEACHER role" }, { status: 400 });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const existing = await prisma.teacherItem.findUnique({
      where: { teacherId_itemId: { teacherId, itemId } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This teacher is already assigned to this class with a fee config" },
        { status: 409 },
      );
    }

    const created = await prisma.teacherItem.create({
      data: { teacherId, itemId, feeAmount, isActive: true },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        item: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        teacherId: created.teacherId,
        itemId: created.itemId,
        feeAmount: created.feeAmount,
        teacher: created.teacher,
        item: created.item,
      },
      { status: 201 },
    );
  } catch (err) {
    return handleApiError(err, "Failed to create teacher fee config");
  }
}
