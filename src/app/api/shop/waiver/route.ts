import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";
import { getWaiverSettings, hasAcceptedCurrentWaiver } from "@/lib/waiver-settings";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== USER_ROLES.MEMBER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [waiver, user] = await Promise.all([
      getWaiverSettings(),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { waiverAcceptedVersion: true, waiverAcceptedAt: true },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hasAccepted = !waiver.isActive
      ? true
      : hasAcceptedCurrentWaiver({
          acceptedVersion: user.waiverAcceptedVersion,
          waiverVersion: waiver.version,
        });

    return NextResponse.json({
      waiver: {
        contentHtml: waiver.contentHtml,
        version: waiver.version,
        isActive: waiver.isActive,
      },
      hasAccepted,
      acceptedAt: user.waiverAcceptedAt,
      acceptedVersion: user.waiverAcceptedVersion,
    });
  } catch (error) {
    console.error("Failed to fetch member waiver:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
