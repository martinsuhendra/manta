import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-utils";
import { resolveAssetUrl } from "@/lib/cloudinary-asset";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

export async function GET() {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if ([USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(user.role)) {
      const brands = await prisma.brand.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          logoAsset: true,
          primaryColor: true,
          accentColor: true,
          isActive: true,
        },
      });
      return NextResponse.json(
        brands.map((brand) => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          logo: resolveAssetUrl(brand.logoAsset, brand.logo),
          primaryColor: brand.primaryColor,
          accentColor: brand.accentColor,
          isActive: brand.isActive,
        })),
      );
    }

    const membershipBrandRows = await prisma.membershipBrand.findMany({
      where: {
        membership: {
          userId: session.user.id,
          status: "ACTIVE",
          expiredAt: { gt: new Date() },
        },
      },
      distinct: ["brandId"],
      select: { brandId: true },
    });
    const accessibleBrandIds = membershipBrandRows.map((row) => row.brandId);

    const brands = await prisma.brand.findMany({
      where: {
        isActive: true,
        ...(accessibleBrandIds.length ? { id: { in: accessibleBrandIds } } : {}),
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        logoAsset: true,
        primaryColor: true,
        accentColor: true,
        isActive: true,
      },
    });

    return NextResponse.json(
      brands.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logo: resolveAssetUrl(b.logoAsset, b.logo),
        primaryColor: b.primaryColor,
        accentColor: b.accentColor,
        isActive: b.isActive,
      })),
    );
  } catch (err) {
    console.error("Failed to fetch accessible brands", err);
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 });
  }
}
