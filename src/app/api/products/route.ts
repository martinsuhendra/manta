import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAuth, requireSuperAdmin } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  validDays: z.number().positive("Valid days must be positive"),
  features: z.array(z.string()).optional().default([]),
  image: z.string().optional(),
  paymentUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  whatIsIncluded: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const products = await prisma.product.findMany({
      orderBy: { position: "asc" },
      include: {
        _count: {
          select: { memberships: true, transactions: true },
        },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    return handleApiError(error, "Failed to fetch membership products");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    const product = await prisma.product.create({
      data: validatedData,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create membership product");
  }
}
