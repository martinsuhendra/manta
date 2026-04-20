import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";
import { getWaiverSettings } from "@/lib/waiver-settings";

const updateWaiverStatusSchema = z.object({
  isAccepted: z.boolean(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const [waiver, user] = await Promise.all([
      getWaiverSettings(),
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          waiverAcceptedAt: true,
          waiverAcceptedVersion: true,
        },
      }),
    ]);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      waiver: {
        contentHtml: waiver.contentHtml,
        version: waiver.version,
        isActive: waiver.isActive,
      },
      member: {
        waiverAcceptedAt: user.waiverAcceptedAt,
        waiverAcceptedVersion: user.waiverAcceptedVersion,
      },
    });
  } catch (error) {
    console.error("Failed to fetch user waiver status:", error);
    return NextResponse.json({ error: "Failed to fetch user waiver status" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { isAccepted } = updateWaiverStatusSchema.parse(body);
    const waiver = await getWaiverSettings();

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updated = await prisma.user.update({
      where: { id },
      data: isAccepted
        ? {
            waiverAcceptedAt: new Date(),
            waiverAcceptedVersion: waiver.version,
          }
        : {
            waiverAcceptedAt: null,
            waiverAcceptedVersion: null,
            waiverAcceptedIp: null,
            waiverAcceptedUserAgent: null,
          },
      select: {
        id: true,
        waiverAcceptedAt: true,
        waiverAcceptedVersion: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });

    console.error("Failed to update user waiver status:", error);
    return NextResponse.json({ error: "Failed to update user waiver status" }, { status: 500 });
  }
}
