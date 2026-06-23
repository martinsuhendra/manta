import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { createPublicCache, publicCacheHeaders } from "@/lib/http-cache";
import { USER_ROLES } from "@/lib/types";
import { getWaiverSettings, hasAcceptedCurrentWaiver } from "@/lib/waiver-settings";

const getCachedPublicWaiver = createPublicCache(["public-waiver"], async () => {
  const waiver = await getWaiverSettings();
  return {
    contentHtml: waiver.contentHtml,
    version: waiver.version,
    isActive: waiver.isActive,
  };
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user.id && session.user.role === USER_ROLES.MEMBER) {
      const waiver = await getWaiverSettings();

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { waiverAcceptedVersion: true, waiverAcceptedAt: true },
      });

      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

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
    }

    const waiver = await getCachedPublicWaiver();

    return NextResponse.json(waiver, { headers: publicCacheHeaders() });
  } catch (error) {
    console.error("Failed to fetch waiver:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
