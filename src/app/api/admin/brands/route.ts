import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { handleApiError, requireSuperAdmin } from "@/lib/api-utils";
import { parseCloudinaryAsset, resolveAssetUrl } from "@/lib/cloudinary-asset";
import { prisma } from "@/lib/generated/prisma";

const createBrandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric and hyphens only"),
  address: z.string().optional(),
  logo: z.string().optional(),
  logoAsset: z.unknown().nullable().optional(),
  primaryColor: z.string().optional().default("#6366f1"),
  accentColor: z.string().optional().default("#8b5cf6"),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        logo: true,
        logoAsset: true,
        primaryColor: true,
        accentColor: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      brands.map((brand) => ({
        ...brand,
        logoAsset: parseCloudinaryAsset(brand.logoAsset),
        logo: resolveAssetUrl(brand.logoAsset, brand.logo),
      })),
    );
  } catch (err) {
    return handleApiError(err, "Failed to fetch brands");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const body = await request.json();
    const validated = createBrandSchema.parse(body);

    const existing = await prisma.brand.findUnique({ where: { slug: validated.slug } });
    if (existing) {
      return NextResponse.json({ error: "Brand with this slug already exists" }, { status: 400 });
    }

    const logoAsset = parseCloudinaryAsset(validated.logoAsset);
    const brand = await prisma.brand.create({
      data: {
        id: randomUUID(),
        name: validated.name,
        slug: validated.slug,
        address: validated.address ?? null,
        logoAsset: logoAsset ?? Prisma.JsonNull,
        logo: resolveAssetUrl(logoAsset, validated.logo) ?? null,
        primaryColor: validated.primaryColor,
        accentColor: validated.accentColor,
        isActive: validated.isActive,
      },
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (err) {
    return handleApiError(err, "Failed to create brand");
  }
}
