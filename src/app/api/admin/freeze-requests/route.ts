import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN].includes(session.user.role as "ADMIN" | "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status"); // all | PENDING_APPROVAL | APPROVED | REJECTED | COMPLETED
    const membershipId = searchParams.get("membershipId");

    const where: { status?: string; membershipId?: string } = {};
    if (statusFilter && statusFilter !== "all") {
      where.status = statusFilter;
    }
    if (membershipId) {
      where.membershipId = membershipId;
    }

    const freezeRequests = await prisma.membershipFreezeRequest.findMany({
      where,
      include: {
        membership: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNo: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                validDays: true,
              },
            },
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
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
