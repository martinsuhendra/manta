import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireSuperAdmin } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";

const updateBrandSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  address: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  isActive: z.boolean().optional(),
});

interface BrandDependencyCounts {
  assignedUsers: number;
  products: number;
  itemBrands: number;
  classSessions: number;
  memberships: number;
  transactions: number;
  bookings: number;
  bookingSettings: number;
  quotaPools: number;
}

async function getBrandDependencyCounts(brandId: string): Promise<BrandDependencyCounts> {
  const [
    assignedUsers,
    products,
    itemBrands,
    classSessions,
    memberships,
    transactions,
    bookings,
    bookingSettings,
    quotaPools,
  ] = await prisma.$transaction([
    prisma.brandUser.count({ where: { brandId } }),
    prisma.product.count({ where: { brandId } }),
    prisma.itemBrand.count({ where: { brandId } }),
    prisma.classSession.count({ where: { brandId } }),
    prisma.membership.count({ where: { brandId } }),
    prisma.transaction.count({ where: { brandId } }),
    prisma.booking.count({ where: { brandId } }),
    prisma.bookingSettings.count({ where: { brandId } }),
    prisma.quotaPool.count({ where: { brandId } }),
  ]);

  return {
    assignedUsers,
    products,
    itemBrands,
    classSessions,
    memberships,
    transactions,
    bookings,
    bookingSettings,
    quotaPools,
  };
}

function buildDeleteBlockReasons({
  isLastActiveBrand,
  dependencyCounts,
}: {
  isLastActiveBrand: boolean;
  dependencyCounts: BrandDependencyCounts;
}) {
  const reasons: string[] = [];
  if (isLastActiveBrand) reasons.push("You cannot delete the last active brand.");
  if (dependencyCounts.assignedUsers > 0) reasons.push("This brand still has assigned users.");
  if (
    dependencyCounts.products > 0 ||
    dependencyCounts.itemBrands > 0 ||
    dependencyCounts.classSessions > 0 ||
    dependencyCounts.memberships > 0 ||
    dependencyCounts.transactions > 0 ||
    dependencyCounts.bookings > 0 ||
    dependencyCounts.bookingSettings > 0 ||
    dependencyCounts.quotaPools > 0
  ) {
    reasons.push(
      "This brand is referenced by products, classes, sessions, memberships, bookings, transactions, booking settings, or quota pools.",
    );
  }
  if (reasons.length > 0) reasons.push("Remove or reassign dependent data first, then try deleting again.");
  return reasons;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const { id } = await params;

    const brand = await prisma.brand.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        logo: true,
        primaryColor: true,
        accentColor: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch (err) {
    return handleApiError(err, "Failed to fetch brand");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const validated = updateBrandSchema.parse(body);

    if (validated.slug) {
      const existing = await prisma.brand.findFirst({
        where: { slug: validated.slug, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json({ error: "Brand with this slug already exists" }, { status: 400 });
      }
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        ...(validated.name != null && { name: validated.name }),
        ...(validated.slug != null && { slug: validated.slug }),
        ...(validated.address !== undefined && { address: validated.address }),
        ...(validated.logo !== undefined && { logo: validated.logo }),
        ...(validated.primaryColor != null && { primaryColor: validated.primaryColor }),
        ...(validated.accentColor != null && { accentColor: validated.accentColor }),
        ...(validated.isActive != null && { isActive: validated.isActive }),
      },
    });

    return NextResponse.json(brand);
  } catch (err) {
    return handleApiError(err, "Failed to update brand");
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const { id } = await params;

    const brand = await prisma.brand.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const [activeBrandsCount, dependencyCounts] = await Promise.all([
      prisma.brand.count({ where: { isActive: true } }),
      getBrandDependencyCounts(id),
    ]);

    const isLastActiveBrand = brand.isActive && activeBrandsCount <= 1;
    const reasons = buildDeleteBlockReasons({ isLastActiveBrand, dependencyCounts });

    if (reasons.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete brand",
          reasons,
          dependencyCounts,
        },
        { status: 400 },
      );
    }

    await prisma.brand.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleApiError(err, "Failed to delete brand");
  }
}
