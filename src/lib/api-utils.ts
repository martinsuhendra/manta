import { NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }

  return { error: null, session };
}

export async function requireSuperAdmin() {
  const { error, session } = await requireAuth();
  if (error) return { error, user: null };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== USER_ROLES.SUPERADMIN) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), user: null };
  }

  return { error: null, user };
}

export function handleApiError(error: unknown, defaultMessage: string) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
  }

  console.error(defaultMessage, error);
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ error: defaultMessage, details: message }, { status: 500 });
}
