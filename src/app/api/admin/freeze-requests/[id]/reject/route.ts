import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { FREEZE_REQUEST_STATUS } from "@/lib/constants/freeze";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

const rejectSchema = z.object({
  rejectionReason: z.string().max(500).optional(),
});

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
    const body = await request.json().catch(() => ({}));
    const validatedData = rejectSchema.parse(body);

    const freezeRequest = await prisma.membershipFreezeRequest.findUnique({
      where: { id: freezeRequestId },
    });

    if (!freezeRequest) {
      return NextResponse.json({ error: "Freeze request not found" }, { status: 404 });
    }

    if (freezeRequest.status !== FREEZE_REQUEST_STATUS.PENDING_APPROVAL) {
      return NextResponse.json({ error: "Freeze request is not pending approval" }, { status: 400 });
    }

    const updated = await prisma.membershipFreezeRequest.update({
      where: { id: freezeRequestId },
      data: {
        status: FREEZE_REQUEST_STATUS.REJECTED,
        approvedById: session.user.id,
        rejectionReason: validatedData.rejectionReason,
      },
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
    console.error("Error rejecting freeze request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
