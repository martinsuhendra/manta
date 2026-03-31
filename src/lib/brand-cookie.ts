import { cookies } from "next/headers";

import { prisma } from "@/lib/generated/prisma";

export async function resolveActiveBrandIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieBrandId = cookieStore.get("active_brand_id")?.value;

  if (cookieBrandId) {
    const cookieBrand = await prisma.brand.findFirst({
      where: { id: cookieBrandId, isActive: true },
      select: { id: true },
    });
    if (cookieBrand) return cookieBrand.id;
  }

  const fallbackBrand = await prisma.brand.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return fallbackBrand?.id ?? null;
}
