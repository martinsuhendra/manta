import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAuth, requireSuperAdmin } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";

const updateProductSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive").optional(),
  validDays: z.number().positive("Valid days must be positive").optional(),
  quota: z.number().positive("Quota must be positive").optional(),
  features: z.array(z.string()).optional(),
  image: z.string().optional(),
  paymentUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  whatIsIncluded: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await requireAuth();
    if (error) return error;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { memberships: true, transactions: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    return handleApiError(error, "Failed to fetch membership product");
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    const product = await prisma.product.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(product);
  } catch (error) {
    return handleApiError(error, "Failed to update membership product");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const existingTransactions = await prisma.transaction.findFirst({
      where: { productId: id },
    });

    if (existingTransactions) {
      return NextResponse.json(
        {
          error: "Cannot delete product with existing transactions. Please deactivate the product instead.",
        },
        { status: 400 },
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Membership product deleted successfully" });
  } catch (error) {
    return handleApiError(error, "Failed to delete membership product");
  }
}
