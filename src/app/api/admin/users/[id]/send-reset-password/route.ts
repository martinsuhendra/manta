import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { createPasswordResetToken } from "@/lib/auth/tokens";
import { emailService } from "@/lib/email/service";
import { createPasswordResetTemplate } from "@/lib/email/templates";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN].includes(session.user.role as "ADMIN" | "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.email) {
      return NextResponse.json({ error: "User has no email address. Cannot send reset link." }, { status: 400 });
    }

    const { token } = await createPasswordResetToken(user.email);
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    const emailTemplate = createPasswordResetTemplate(resetUrl);

    const emailSent = await emailService.sendEmail(user.email, emailTemplate);

    if (!emailSent) {
      return NextResponse.json({ error: "Failed to send password reset email" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Password reset link has been sent to the user's email",
    });
  } catch (error) {
    console.error("Send reset password error:", error);
    return NextResponse.json({ error: "Failed to send password reset link" }, { status: 500 });
  }
}
