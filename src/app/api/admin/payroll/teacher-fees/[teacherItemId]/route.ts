import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAdmin } from "@/lib/api-utils";
import { resolveAssetUrl } from "@/lib/cloudinary-asset";
import { prisma } from "@/lib/generated/prisma";
import { TeacherFeeModel } from "@/lib/teacher-fee-model";

const intCoerceMin = (min: number) =>
  z.coerce
    .number()
    .transform((n) => Math.round(n))
    .pipe(z.number().int().min(min));

const updateSchema = z
  .object({
    feeAmount: intCoerceMin(0).optional(),
    feeModel: z.nativeEnum(TeacherFeeModel).optional(),
    perParticipantMinGuarantee: z.union([z.null(), intCoerceMin(0)]).optional(),
    perParticipantGuaranteeMaxPax: z.union([z.null(), intCoerceMin(1)]).optional(),
  })
  .superRefine((d, ctx) => {
    const touched =
      d.feeAmount !== undefined ||
      d.feeModel !== undefined ||
      d.perParticipantMinGuarantee !== undefined ||
      d.perParticipantGuaranteeMaxPax !== undefined;
    if (!touched) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide at least one field to update" });
    }
    const minT = d.perParticipantMinGuarantee !== undefined;
    const maxT = d.perParticipantGuaranteeMaxPax !== undefined;
    if (minT !== maxT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Update both minimum guarantee and max participants together, or neither.",
        path: ["perParticipantMinGuarantee"],
      });
    }
  });

function mapUpdated(ti: {
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ teacherItemId: string }> }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { teacherItemId } = await params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const existing = await prisma.teacherItem.findUnique({ where: { id: teacherItemId } });
    if (!existing) {
      return NextResponse.json({ error: "Teacher fee config not found" }, { status: 404 });
    }

    const nextModel = parsed.feeModel ?? existing.feeModel;
    let nextMin = existing.perParticipantMinGuarantee;
    let nextMax = existing.perParticipantGuaranteeMaxPax;

    if (parsed.perParticipantMinGuarantee !== undefined) nextMin = parsed.perParticipantMinGuarantee;
    if (parsed.perParticipantGuaranteeMaxPax !== undefined) nextMax = parsed.perParticipantGuaranteeMaxPax;

    if (nextModel === TeacherFeeModel.FLAT_PER_SESSION) {
      nextMin = null;
      nextMax = null;
    } else {
      const hasMin = nextMin != null;
      const hasMax = nextMax != null;
      if (hasMin !== hasMax) {
        return NextResponse.json(
          {
            error: "For per-participant fees, set both minimum guarantee and max participants, or clear both (null).",
          },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.teacherItem.update({
      where: { id: teacherItemId },
      data: {
        ...(parsed.feeAmount !== undefined ? { feeAmount: parsed.feeAmount } : {}),
        ...(parsed.feeModel !== undefined ? { feeModel: parsed.feeModel } : {}),
        perParticipantMinGuarantee: nextMin,
        perParticipantGuaranteeMaxPax: nextMax,
      },
      include: {
        teacher: { select: { id: true, name: true, email: true, image: true, avatarAsset: true } },
        item: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(mapUpdated(updated));
  } catch (err) {
    return handleApiError(err, "Failed to update teacher fee");
  }
}
