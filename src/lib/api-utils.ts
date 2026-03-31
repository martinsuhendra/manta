import { NextRequest, NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
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

  if (![USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(user?.role ?? "")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), user: null };
  }

  return { error: null, user };
}

export async function requireAdmin() {
  const { error, session } = await requireAuth();
  if (error) return { error, user: null };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || ![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), user: null };
  }

  return { error: null, user };
}

export async function requireBrandAccess(request: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) {
    return {
      error,
      brandIds: null,
      session: null,
    };
  }

  const activeBrandId = request.headers.get("x-brand-id");

  const brandUsers = await prisma.brandUser.findMany({
    where: { userId: session.user.id },
    select: { brandId: true },
  });

  const accessibleBrandIds = brandUsers.map((bu) => bu.brandId);

  if (!accessibleBrandIds.length) {
    return {
      error: NextResponse.json({ error: "No brand access configured" }, { status: 403 }),
      brandIds: null,
      session,
    };
  }

  if (!activeBrandId) {
    return { error: null, brandIds: accessibleBrandIds, session };
  }

  if (!accessibleBrandIds.includes(activeBrandId)) {
    return {
      error: NextResponse.json({ error: "Forbidden for this brand" }, { status: 403 }),
      brandIds: null,
      session,
    };
  }

  return { error: null, brandIds: [activeBrandId], session };
}

export function getBrandFilterFromRequest(request: NextRequest, brandIds: string[] | null) {
  const headerBrandId = request.headers.get("x-brand-id");

  if (headerBrandId) return { brandId: headerBrandId };
  if (brandIds && brandIds.length === 1) return { brandId: brandIds[0] };
  if (brandIds && brandIds.length > 1) return { brandId: { in: brandIds } };

  return {};
}

/** Items are linked to brands via `item_brands` — use this instead of `getBrandFilterFromRequest` for `Item` queries. */
export function getItemWhereForBrandAccess(request: NextRequest, brandIds: string[] | null): Prisma.ItemWhereInput {
  const filter = getBrandFilterFromRequest(request, brandIds);
  if (Object.keys(filter).length === 0) return {};

  const raw = (filter as { brandId?: string | { in: string[] } }).brandId;
  if (raw === undefined) return {};

  if (typeof raw === "string") {
    return { itemBrands: { some: { brandId: raw } } };
  }
  if (typeof raw === "object" && "in" in raw && Array.isArray((raw as { in: string[] }).in)) {
    return { itemBrands: { some: { brandId: { in: (raw as { in: string[] }).in } } } };
  }
  return {};
}

export function handleApiError(error: unknown, defaultMessage: string) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
  }

  console.error(defaultMessage, error);
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ error: defaultMessage, details: message }, { status: 500 });
}
