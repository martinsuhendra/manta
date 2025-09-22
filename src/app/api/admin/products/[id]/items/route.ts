import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

import {
  createProductItemSchema,
  updateProductItemSchema,
} from "../../../../../(main)/dashboard/products/_components/schema";

// Helper function to validate product item data
function validateProductItemData(body: unknown): z.infer<typeof createProductItemSchema> {
  return createProductItemSchema.parse(body);
}

// Helper function to validate update data
function validateUpdateData(body: unknown): z.infer<typeof updateProductItemSchema> & { id: string } {
  const { id, ...updateData } = body as Record<string, unknown>;
  if (!id || typeof id !== "string") {
    throw new Error("Product item ID is required");
  }
  const validatedUpdate = updateProductItemSchema.parse(updateData);
  return { id, ...validatedUpdate };
}

// Helper function to create a single product item
async function createProductItem(productId: string, itemData: z.infer<typeof createProductItemSchema>) {
  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // Verify item exists
  const item = await prisma.item.findUnique({
    where: { id: itemData.itemId },
  });

  if (!item) {
    throw new Error(`Item with ID ${itemData.itemId} not found`);
  }

  // Check if item is already associated with this product
  const existingProductItem = await prisma.productItem.findFirst({
    where: {
      productId,
      itemId: itemData.itemId,
    },
  });

  if (existingProductItem) {
    throw new Error(`Item "${item.name}" is already associated with this product`);
  }

  // Create the product item
  return await prisma.productItem.create({
    data: {
      productId,
      itemId: itemData.itemId,
      quotaType: itemData.quotaType,
      quotaValue: itemData.quotaValue,
      quotaPoolId: itemData.quotaPoolId || null,
    },
    include: {
      item: true,
      quotaPool: true,
      _count: {
        select: {
          membershipQuotaUsage: true,
        },
      },
    },
  });
}

// Helper function to update a single product item
async function updateProductItem(itemId: string, updateData: z.infer<typeof updateProductItemSchema>) {
  // Get existing product item with usage count
  const existingProductItem = await prisma.productItem.findUnique({
    where: { id: itemId },
    include: {
      item: true,
      _count: {
        select: {
          membershipQuotaUsage: true,
        },
      },
    },
  });

  if (!existingProductItem) {
    throw new Error("Product item not found");
  }

  // Check if item has active quota usage and prevent modification of critical fields
  if (existingProductItem._count.membershipQuotaUsage > 0) {
    const restrictedFields = ["quotaType", "quotaValue", "quotaPoolId"];
    const hasRestrictedChanges = restrictedFields.some(
      (field) =>
        updateData[field as keyof typeof updateData] !== undefined &&
        updateData[field as keyof typeof updateData] !== existingProductItem[field as keyof typeof existingProductItem],
    );

    if (hasRestrictedChanges) {
      throw new Error(
        `Cannot modify quota settings for ${existingProductItem.item.name} as it has active quota usage. Members are using this item.`,
      );
    }
  }

  // Update the product item
  return await prisma.productItem.update({
    where: { id: itemId },
    data: updateData,
    include: {
      item: true,
      quotaPool: true,
      _count: {
        select: {
          membershipQuotaUsage: true,
        },
      },
    },
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

    const productItems = await prisma.productItem.findMany({
      where: { productId: id },
      include: {
        item: true,
        quotaPool: true,
        _count: {
          select: {
            membershipQuotaUsage: true,
          },
        },
      },
    });

    return NextResponse.json(productItems);
  } catch (error) {
    console.error("Error fetching product items:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Handle multiple items
    const items = Array.isArray(body) ? body : [body];
    const createdItems = [];

    for (const itemData of items) {
      const validatedData = validateProductItemData(itemData);
      const createdItem = await createProductItem(id, validatedData);
      createdItems.push(createdItem);
    }

    return NextResponse.json(createdItems.length === 1 ? createdItems[0] : createdItems);
  } catch (error) {
    console.error("Error creating product items:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = validateUpdateData(body);

    const updatedItem = await updateProductItem(validatedData.id, validatedData);

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating product item:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
