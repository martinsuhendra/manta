import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import { consumePasswordResetToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/generated/prisma";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token reset yang valid diperlukan" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Kata sandi harus minimal 6 karakter" }, { status: 400 });
    }

    // Consume the reset token and get email
    const email = await consumePasswordResetToken(token);

    if (!email) {
      return NextResponse.json({ error: "Token reset tidak valid atau sudah kedaluwarsa" }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Kata sandi berhasil diatur ulang",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Gagal mengatur ulang kata sandi" }, { status: 500 });
  }
}
