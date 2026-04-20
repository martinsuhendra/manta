import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { handleApiError, requireAdmin, requireAuth } from "@/lib/api-utils";
import { resolveAssetUrl } from "@/lib/cloudinary-asset";
import { prisma } from "@/lib/generated/prisma";
import { RBAC_ADMIN_ROLES } from "@/lib/rbac";
import { TeacherFeeModel } from "@/lib/teacher-fee-model";
import { USER_ROLES } from "@/lib/types";

const createTeacherFeeSchema = z
  .object({
    teacherId: z.string().uuid(),
    itemId: z.string().uuid(),
    feeAmount: z.coerce
      .number()
      .transform((n) => Math.round(n))
      .pipe(z.number().int().min(0)),
    feeModel: z.nativeEnum(TeacherFeeModel).optional().default(TeacherFeeModel.FLAT_PER_SESSION),
    perParticipantMinGuarantee: z.number().int().min(0).optional(),
    perParticipantGuaranteeMaxPax: z.number().int().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.feeModel !== TeacherFeeModel.PER_PARTICIPANT) return;
    const hasMin = data.perParticipantMinGuarantee !== undefined;
    const hasMax = data.perParticipantGuaranteeMaxPax !== undefined;
    if (hasMin !== hasMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "For per-participant fees, set both minimum guarantee (IDR) and maximum participants, or leave both unset.",
        path: ["perParticipantMinGuarantee"],
      });
    }
  });

function mapRow(ti: {
  id: string;
  teacherId: string;
  itemId: string;
  feeModel: (typeof TeacherFeeModel)[keyof typeof TeacherFeeModel];
  feeAmount: number;
  perParticipantMinGuarantee: number | null;
  perParticipantGuaranteeMaxPax: number | null;
  teacher: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    avatarAsset: unknown;
  };
  item: { id: string; name: string };
}) {
  return {
    id: ti.id,
    teacherId: ti.teacherId,
    itemId: ti.itemId,
    feeModel: ti.feeModel,
    feeAmount: ti.feeAmount,
    perParticipantMinGuarantee: ti.perParticipantMinGuarantee,
    perParticipantGuaranteeMaxPax: ti.perParticipantGuaranteeMaxPax,
    teacher: {
      id: ti.teacher.id,
      name: ti.teacher.name,
      email: ti.teacher.email,
      image: resolveAssetUrl(ti.teacher.avatarAsset, ti.teacher.image),
    },
    item: ti.item,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const isAdmin = RBAC_ADMIN_ROLES.includes(session.user.role);
    const isTeacher = session.user.role === USER_ROLES.TEACHER;
    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    let teacherId = searchParams.get("teacherId") || undefined;
    if (isTeacher) {
      teacherId = session.user.id;
    }
    const itemId = searchParams.get("itemId") || undefined;

    const teacherItems = await prisma.teacherItem.findMany({
      where: {
        ...(teacherId && { teacherId }),
        ...(itemId && { itemId }),
      },
      include: {
        teacher: { select: { id: true, name: true, email: true, image: true, avatarAsset: true } },
        item: { select: { id: true, name: true } },
      },
      orderBy: [{ teacherId: "asc" }, { itemId: "asc" }],
    });

    const rows = teacherItems.map((ti) => mapRow(ti));

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
    const parsed = createTeacherFeeSchema.parse(body);
    const { teacherId, itemId, feeAmount, feeModel } = parsed;

    let perParticipantMinGuarantee: number | null = null;
    let perParticipantGuaranteeMaxPax: number | null = null;
    if (feeModel === TeacherFeeModel.PER_PARTICIPANT) {
      if (parsed.perParticipantMinGuarantee !== undefined && parsed.perParticipantGuaranteeMaxPax !== undefined) {
        perParticipantMinGuarantee = parsed.perParticipantMinGuarantee;
        perParticipantGuaranteeMaxPax = parsed.perParticipantGuaranteeMaxPax;
      }
    }

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

    const existingRow = await prisma.teacherItem.findUnique({
      where: { teacherId_itemId: { teacherId, itemId } },
    });

    if (existingRow) {
      const teacherLabel = teacher.name ?? teacher.email ?? "This teacher";
      return NextResponse.json(
        {
          error: `A fee config already exists for ${teacherLabel} and “${item.name}”. Edit the existing row in the table instead.`,
        },
        { status: 409 },
      );
    }

    const include = {
      teacher: { select: { id: true, name: true, email: true, image: true, avatarAsset: true } },
      item: { select: { id: true, name: true } },
    } as const;

    const saved = await prisma.teacherItem.create({
      data: {
        teacherId,
        itemId,
        feeAmount,
        feeModel,
        isActive: true,
        perParticipantMinGuarantee,
        perParticipantGuaranteeMaxPax,
      },
      include,
    });

    return NextResponse.json(mapRow(saved), { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json({ error: "Invalid data for database", details: err.message }, { status: 400 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2022") {
        return NextResponse.json(
          {
            error:
              "Database is missing columns for teacher fees. Run the latest Prisma migration (e.g. fee_model on teacher_items).",
            details: err.message,
          },
          { status: 503 },
        );
      }
      if (err.code === "P2002") {
        return NextResponse.json(
          { error: "A fee config for this teacher and class already exists. Edit the existing row in the table." },
          { status: 409 },
        );
      }
      console.error("teacher-fees POST Prisma", err.code, err.message, err.meta);
      return NextResponse.json(
        { error: "Failed to create teacher fee config", code: err.code, details: err.message, meta: err.meta },
        { status: 500 },
      );
    }
    return handleApiError(err, "Failed to create teacher fee config");
  }
}
