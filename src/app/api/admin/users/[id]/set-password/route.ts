import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

const setPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const allowedRoles = [USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!allowedRoles.includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: userId } = await params;
    const body = await request.json();
    const { password } = setPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });

    console.error("Set password error:", error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
