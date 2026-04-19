import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.MEMBER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Freeze requests are now admin-managed only.
    return NextResponse.json(
      { error: "Freeze requests must be submitted through admin. Please contact admin for assistance." },
      { status: 403 },
    );
  } catch (error) {
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
