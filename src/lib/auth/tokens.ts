import { randomBytes, randomInt } from "crypto";

import { prisma } from "@/lib/generated/prisma";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function generateVerificationCode(): string {
  return randomInt(100000, 999999).toString();
}

export async function createEmailVerificationToken(email: string): Promise<{ token: string; code: string }> {
  const token = generateToken();
  const code = generateVerificationCode();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Delete existing tokens for this email
  await prisma.emailVerificationToken.deleteMany({
    where: { email },
  });

  await prisma.emailVerificationToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  return { token, code };
}

export async function createPasswordResetToken(email: string): Promise<{ token: string }> {
  const token = generateToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Delete existing tokens for this email
  await prisma.passwordResetToken.deleteMany({
    where: { email },
  });

  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  return { token };
}

export async function verifyEmailToken(token: string): Promise<{ email: string } | null> {
  const tokenRecord = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!tokenRecord || tokenRecord.expires < new Date()) {
    // Clean up expired token
    if (tokenRecord) {
      await prisma.emailVerificationToken.delete({
        where: { id: tokenRecord.id },
      });
    }
    return null;
  }

  return { email: tokenRecord.email };
}

export async function verifyPasswordResetToken(token: string): Promise<{ email: string } | null> {
  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!tokenRecord || tokenRecord.expires < new Date()) {
    // Clean up expired token
    if (tokenRecord) {
      await prisma.passwordResetToken.delete({
        where: { id: tokenRecord.id },
      });
    }
    return null;
  }

  return { email: tokenRecord.email };
}

export async function consumeEmailVerificationToken(token: string): Promise<boolean> {
  try {
    const tokenRecord = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!tokenRecord || tokenRecord.expires < new Date()) {
      return false;
    }

    // Mark user as email verified
    await prisma.user.update({
      where: { email: tokenRecord.email },
      data: { emailVerified: new Date() },
    });

    // Delete the used token
    await prisma.emailVerificationToken.delete({
      where: { id: tokenRecord.id },
    });

    return true;
  } catch (error) {
    console.error("Error consuming email verification token:", error);
    return false;
  }
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
  try {
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!tokenRecord || tokenRecord.expires < new Date()) {
      return null;
    }

    // Delete the used token
    await prisma.passwordResetToken.delete({
      where: { id: tokenRecord.id },
    });

    return tokenRecord.email;
  } catch (error) {
    console.error("Error consuming password reset token:", error);
    return null;
  }
}
