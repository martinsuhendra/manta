import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { emailService } from "@/lib/email/service";
import { createUserLinkTemplate } from "@/lib/email/templates";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

const sendLinkSchema = z.object({
  type: z.enum(["waiver", "payment"]),
  link: z.string().url("Please provide a valid URL"),
});

const allowedRoles = [USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!allowedRoles.includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { link, type } = sendLinkSchema.parse(body);
    const { id: userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!user.email) return NextResponse.json({ error: "User has no email address" }, { status: 400 });

    const emailTemplate = createUserLinkTemplate({
      linkType: type,
      linkUrl: link,
      recipientName: user.name,
    });
    const emailSent = await emailService.sendEmail(user.email, emailTemplate);
    if (!emailSent) return NextResponse.json({ error: `Failed to send ${type} link email` }, { status: 500 });

    return NextResponse.json({
      success: true,
      message: `${type === "waiver" ? "Waiver" : "Payment"} link has been sent`,
    });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });

    console.error("Send user link error:", error);
    return NextResponse.json({ error: "Failed to send link" }, { status: 500 });
  }
}
