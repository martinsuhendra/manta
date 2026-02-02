import { NextRequest, NextResponse } from "next/server";

import { FREEZE_REQUEST_STATUS } from "@/lib/constants/freeze";
import { prisma } from "@/lib/generated/prisma";
import { MEMBERSHIP_STATUS } from "@/lib/types";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const expiredFreezes = await prisma.membershipFreezeRequest.findMany({
      where: {
        status: FREEZE_REQUEST_STATUS.APPROVED,
        freezeEndDate: { lte: now },
      },
      include: {
        membership: true,
      },
    });

    if (expiredFreezes.length === 0) {
      return NextResponse.json({
        message: "No frozen memberships to reactivate",
        reactivated: 0,
      });
    }

    await prisma.$transaction(
      expiredFreezes.flatMap((fr) => [
        prisma.membership.update({
          where: { id: fr.membershipId },
          data: { status: MEMBERSHIP_STATUS.ACTIVE },
        }),
        prisma.membershipFreezeRequest.update({
          where: { id: fr.id },
          data: { status: FREEZE_REQUEST_STATUS.COMPLETED },
        }),
      ]),
    );

    return NextResponse.json({
      message: `Reactivated ${expiredFreezes.length} frozen membership(s)`,
      reactivated: expiredFreezes.length,
    });
  } catch (error) {
    console.error("Error reactivating frozen memberships:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
