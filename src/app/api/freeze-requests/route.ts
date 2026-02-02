import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { FREEZE_REASON, FREEZE_REQUEST_STATUS } from "@/lib/constants/freeze";
import { prisma } from "@/lib/generated/prisma";
import { MEMBERSHIP_STATUS, USER_ROLES } from "@/lib/types";

const createFreezeRequestSchema = z.object({
  membershipId: z.string().uuid("Invalid membership ID"),
  reason: z.enum([FREEZE_REASON.MEDICAL, FREEZE_REASON.PERSONAL]),
  reasonDetails: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.MEMBER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createFreezeRequestSchema.parse(body);

    const membership = await prisma.membership.findUnique({
      where: { id: validatedData.membershipId },
      include: {
        freezeRequests: {
          where: {
            status: { in: [FREEZE_REQUEST_STATUS.PENDING_APPROVAL, FREEZE_REQUEST_STATUS.APPROVED] },
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    if (membership.userId !== session.user.id) {
      return NextResponse.json({ error: "Membership does not belong to you" }, { status: 403 });
    }

    if (membership.status !== MEMBERSHIP_STATUS.ACTIVE) {
      return NextResponse.json({ error: "Only active memberships can be frozen" }, { status: 400 });
    }

    if (membership.expiredAt <= new Date()) {
      return NextResponse.json({ error: "Membership has expired" }, { status: 400 });
    }

    const pendingRequest = membership.freezeRequests.find((r) => r.status === FREEZE_REQUEST_STATUS.PENDING_APPROVAL);
    if (pendingRequest) {
      return NextResponse.json(
        { error: "You already have a pending freeze request for this membership" },
        { status: 400 },
      );
    }

    const activeFreeze = membership.freezeRequests.find(
      (r) => r.status === FREEZE_REQUEST_STATUS.APPROVED && r.freezeEndDate && r.freezeEndDate > new Date(),
    );
    if (activeFreeze) {
      return NextResponse.json({ error: "Membership is already frozen" }, { status: 400 });
    }

    const freezeRequest = await prisma.membershipFreezeRequest.create({
      data: {
        membershipId: validatedData.membershipId,
        reason: validatedData.reason,
        reasonDetails: validatedData.reasonDetails,
        status: FREEZE_REQUEST_STATUS.PENDING_APPROVAL,
        requestedById: session.user.id,
      },
      include: {
        membership: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(freezeRequest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Error creating freeze request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.MEMBER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const freezeRequests = await prisma.membershipFreezeRequest.findMany({
      where: {
        requestedById: session.user.id,
      },
      include: {
        membership: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(freezeRequests);
  } catch (error) {
    console.error("Error fetching freeze requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
