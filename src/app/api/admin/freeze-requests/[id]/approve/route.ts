import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { FREEZE_REQUEST_STATUS } from "@/lib/constants/freeze";
import {
  calculateFreezeEndDate,
  calculateTotalFrozenDays,
  extendExpirationByFreezeDays,
} from "@/lib/freeze/calculator";
import { prisma } from "@/lib/generated/prisma";
import { MEMBERSHIP_STATUS, USER_ROLES } from "@/lib/types";

const approveSchema = z
  .object({
    presetDays: z.number().int().positive().optional(),
    customDays: z.number().int().positive().optional(),
    freezeEndDate: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      const hasPreset = data.presetDays !== undefined;
      const hasCustom = data.customDays !== undefined;
      const hasEndDate = data.freezeEndDate !== undefined;
      return (hasPreset ? 1 : 0) + (hasCustom ? 1 : 0) + (hasEndDate ? 1 : 0) === 1;
    },
    { message: "Provide exactly one: presetDays, customDays, or freezeEndDate" },
  );

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN].includes(session.user.role as "ADMIN" | "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: freezeRequestId } = await params;
    const body = await request.json();
    const validatedData = approveSchema.parse(body);

    const freezeRequest = await prisma.membershipFreezeRequest.findUnique({
      where: { id: freezeRequestId },
      include: {
        membership: true,
      },
    });

    if (!freezeRequest) {
      return NextResponse.json({ error: "Freeze request not found" }, { status: 404 });
    }

    if (freezeRequest.status !== FREEZE_REQUEST_STATUS.PENDING_APPROVAL) {
      return NextResponse.json({ error: "Freeze request is not pending approval" }, { status: 400 });
    }

    if (freezeRequest.membership.status === MEMBERSHIP_STATUS.FREEZED) {
      return NextResponse.json({ error: "Membership is already frozen" }, { status: 400 });
    }

    const freezeStartDate = new Date();
    let freezeEndDate: Date;
    let totalFrozenDays: number;

    if (validatedData.presetDays !== undefined) {
      freezeEndDate = calculateFreezeEndDate(freezeStartDate, validatedData.presetDays);
      totalFrozenDays = validatedData.presetDays;
    } else if (validatedData.customDays !== undefined) {
      freezeEndDate = calculateFreezeEndDate(freezeStartDate, validatedData.customDays);
      totalFrozenDays = validatedData.customDays;
    } else if (validatedData.freezeEndDate) {
      freezeEndDate = new Date(validatedData.freezeEndDate);
      if (freezeEndDate <= freezeStartDate) {
        return NextResponse.json({ error: "Freeze end date must be after start date" }, { status: 400 });
      }
      totalFrozenDays = calculateTotalFrozenDays(freezeStartDate, freezeEndDate);
    } else {
      return NextResponse.json({ error: "Provide presetDays, customDays, or freezeEndDate" }, { status: 400 });
    }

    const membership = freezeRequest.membership;
    const newExpiredAt = extendExpirationByFreezeDays(membership.expiredAt, totalFrozenDays);

    await prisma.$transaction([
      prisma.membership.update({
        where: { id: membership.id },
        data: {
          status: MEMBERSHIP_STATUS.FREEZED,
          expiredAt: newExpiredAt,
        },
      }),
      prisma.membershipFreezeRequest.update({
        where: { id: freezeRequestId },
        data: {
          status: FREEZE_REQUEST_STATUS.APPROVED,
          approvedById: session.user.id,
          freezeStartDate,
          freezeEndDate,
          totalFrozenDays,
        },
      }),
    ]);

    const updated = await prisma.membershipFreezeRequest.findUnique({
      where: { id: freezeRequestId },
      include: {
        membership: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            product: { select: { id: true, name: true } },
          },
        },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Error approving freeze request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
