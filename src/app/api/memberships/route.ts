import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

const purchaseMembershipSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  transactionId: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    let whereCondition = {};

    if (userId && session.user.role === USER_ROLES.SUPERADMIN) {
      whereCondition = { userId };
    } else {
      whereCondition = { userId: session.user.id };
    }

    const memberships = await prisma.membership.findMany({
      where: whereCondition,
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(memberships);
  } catch (error) {
    console.error("Failed to fetch memberships:", error);
    return NextResponse.json({ error: "Failed to fetch memberships" }, { status: 500 });
  }
}

async function validatePurchaseRequest(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return { error: "Unauthorized", status: 401 };
  }

  const body = await request.json();
  const validatedData = purchaseMembershipSchema.parse(body);
  return { session, validatedData };
}

async function validateProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return { error: "Product not found", status: 404 };
  }

  if (!product.isActive) {
    return { error: "Product is not available", status: 400 };
  }

  return { product };
}

export async function POST(request: NextRequest) {
  try {
    const validation = await validatePurchaseRequest(request);
    if ("error" in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { session, validatedData } = validation;

    const productValidation = await validateProduct(validatedData.productId);
    if ("error" in productValidation) {
      return NextResponse.json({ error: productValidation.error }, { status: productValidation.status });
    }

    const { product } = productValidation;

    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + product.validDays);

    // Determine membership status based on transaction
    let membershipStatus = "ACTIVE"; // Default for memberships without transaction (manually created)
    if (validatedData.transactionId) {
      // Check transaction status
      const transaction = await prisma.transaction.findUnique({
        where: { id: validatedData.transactionId },
      });
      // If transaction exists, set membership status based on transaction status
      if (transaction) {
        if (transaction.status === "COMPLETED") {
          membershipStatus = "ACTIVE";
        } else if (["PENDING", "PROCESSING"].includes(transaction.status)) {
          membershipStatus = "PENDING";
        } else {
          membershipStatus = "SUSPENDED";
        }
      } else {
        // Transaction ID provided but not found - default to pending for safety
        membershipStatus = "PENDING";
      }
    }

    const membership = await prisma.membership.create({
      data: {
        userId: session.user.id,
        productId: validatedData.productId,
        expiredAt,
        transactionId: validatedData.transactionId,
        status: membershipStatus,
      },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }

    console.error("Failed to purchase membership:", error);
    return NextResponse.json({ error: "Failed to purchase membership" }, { status: 500 });
  }
}
