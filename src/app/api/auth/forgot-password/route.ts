import { NextRequest, NextResponse } from "next/server";

import { createPasswordResetToken } from "@/lib/auth/tokens";
import { emailService } from "@/lib/email/service";
import { createPasswordResetTemplate } from "@/lib/email/templates";
import { prisma } from "@/lib/generated/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, a password reset email has been sent",
      });
    }

    try {
      // Generate password reset token
      const { token } = await createPasswordResetToken(email);

      // Create reset URL
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

      // Create email template
      const emailTemplate = createPasswordResetTemplate(resetUrl);

      // Send email
      const emailSent = await emailService.sendEmail(email, emailTemplate);

      if (!emailSent) {
        console.error("Failed to send password reset email to:", email);
      }
    } catch (emailError) {
      console.error("Email service error:", emailError);
      // Continue without failing - we don't want to expose email service issues
    }

    return NextResponse.json({
      success: true,
      message: "If an account with this email exists, a password reset email has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process password reset request" }, { status: 500 });
  }
}
