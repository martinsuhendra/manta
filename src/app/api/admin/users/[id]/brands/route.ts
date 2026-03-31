import { NextRequest, NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id: userId } = await params;

  const brandUsers = await prisma.brandUser.findMany({
    where: { userId },
    include: {
      brand: {
        select: { id: true, name: true, slug: true, isActive: true },
      },
    },
  });

  return NextResponse.json(
    brandUsers.map((bu) => ({
      brandId: bu.brandId,
      role: bu.role,
      isDefault: bu.isDefault,
      brand: bu.brand,
    })),
  );
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id: userId } = await params;
  const body = await request.json();
  const {
    brandId,
    role = "MEMBER",
    isDefault = false,
  } = body as { brandId: string; role?: string; isDefault?: boolean };

  if (!brandId) {
    return NextResponse.json({ error: "brandId is required" }, { status: 400 });
  }

  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (isDefault) {
    await prisma.brandUser.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  await prisma.brandUser.upsert({
    where: { brandId_userId: { brandId, userId } },
    create: { userId, brandId, role, isDefault },
    update: { role, isDefault },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id: userId } = await params;
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId");
  if (!brandId) {
    return NextResponse.json({ error: "brandId query param required" }, { status: 400 });
  }

  await prisma.brandUser.deleteMany({
    where: { userId, brandId },
  });

  return new NextResponse(null, { status: 204 });
}
