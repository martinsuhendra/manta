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

    const brandUsers = await prisma.brandUser.findMany({
      where: { userId: session.user.id },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            logoAsset: true,
            primaryColor: true,
            accentColor: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    const brands = brandUsers
      .map((bu) => bu.brand)
      .filter((b) => b.isActive)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logo: resolveAssetUrl(b.logoAsset, b.logo),
        primaryColor: b.primaryColor,
        accentColor: b.accentColor,
        isActive: b.isActive,
      }));

    return NextResponse.json(brands);
  } catch (err) {
    console.error("Failed to fetch accessible brands", err);
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 });
  }
}
