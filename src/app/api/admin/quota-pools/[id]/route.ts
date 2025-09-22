import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { createQuotaPoolSchema } from "@/app/(main)/dashboard/products/_components/schema";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

// Helper function to validate quota pool data
function validateQuotaPoolData(body: unknown): z.infer<typeof createQuotaPoolSchema> {
  return createQuotaPoolSchema.parse(body);
}

// Helper function to check quota pool usage
async function checkQuotaPoolUsage(quotaPoolId: string) {
  return await prisma.quotaPool.findUnique({
    where: { id: quotaPoolId },
    include: {
      _count: {
        select: {
          membershipQuotaUsage: true,
        },
      },
    },
  });
}

// Helper function to update quota pool
async function updateQuotaPool(quotaPoolId: string, data: z.infer<typeof createQuotaPoolSchema>) {
  return await prisma.quotaPool.update({
    where: { id: quotaPoolId },
    data,
    include: {
      productItems: true,
      _count: {
        select: {
          membershipQuotaUsage: true,
        },
      },
    },
  });
}

// Helper function to delete quota pool
async function deleteQuotaPool(quotaPoolId: string) {
  // Check if quota pool has active usage
  const quotaPool = await checkQuotaPoolUsage(quotaPoolId);

  if (!quotaPool) {
    throw new Error("Quota pool not found");
  }

  if (quotaPool._count.membershipQuotaUsage > 0) {
    throw new Error(`Cannot delete "${quotaPool.name}" as it has active quota usage. Members are using this pool.`);
  }

  // Check if quota pool is used by any product items
  const productItems = await prisma.productItem.findMany({
    where: { quotaPoolId },
    include: {
      product: {
        select: { name: true },
      },
    },
  });

  if (productItems.length > 0) {
    const productNames = productItems.map((pi) => pi.product.name).join(", ");
    throw new Error(`Cannot delete "${quotaPool.name}" as it is used by the following products: ${productNames}`);
  }

  return await prisma.quotaPool.delete({
    where: { id: quotaPoolId },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const quotaPool = await prisma.quotaPool.findUnique({
      where: { id },
      include: {
        productItems: true,
        _count: {
          select: {
            membershipQuotaUsage: true,
          },
        },
      },
    });

    if (!quotaPool) {
      return NextResponse.json({ error: "Quota pool not found" }, { status: 404 });
    }

    return NextResponse.json(quotaPool);
  } catch (error) {
    console.error("Error fetching quota pool:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = validateQuotaPoolData(body);

    // Check if quota pool has active usage before allowing edits
    const existingQuotaPool = await checkQuotaPoolUsage(id);

    if (!existingQuotaPool) {
      return NextResponse.json({ error: "Quota pool not found" }, { status: 404 });
    }

    // Prevent modification of totalQuota if there's active usage
    if (
      existingQuotaPool._count.membershipQuotaUsage > 0 &&
      validatedData.totalQuota !== existingQuotaPool.totalQuota
    ) {
      return NextResponse.json(
        {
          error: `Cannot modify total quota for "${existingQuotaPool.name}" as it has active quota usage. Members are using this pool.`,
        },
        { status: 400 },
      );
    }

    const updatedQuotaPool = await updateQuotaPool(id, validatedData);

    return NextResponse.json(updatedQuotaPool);
  } catch (error) {
    console.error("Error updating quota pool:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await deleteQuotaPool(id);

    return NextResponse.json({ message: "Quota pool deleted successfully" });
  } catch (error) {
    console.error("Error deleting quota pool:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
