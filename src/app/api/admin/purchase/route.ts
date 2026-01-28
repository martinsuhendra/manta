import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { requireAdmin } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";
import { createSnapTransaction, MEMBERSHIP_STATUS, TRANSACTION_STATUS, type TransactionMetadata } from "@/lib/midtrans";
import { DEFAULT_USER_ROLE } from "@/lib/types";

const adminPurchaseSchema = z.object({
  userId: z.string().uuid("Invalid user ID").optional(),
  productId: z.string().uuid("Invalid product ID"),
  customerEmail: z.string().email("Invalid email address").optional(),
  customerName: z.string().min(1, "Name is required").optional(),
  customerPhone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const body = await request.json();
    const validatedData = adminPurchaseSchema.parse(body);

    // Validate product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.isActive) {
      return NextResponse.json({ error: "Product is not available" }, { status: 400 });
    }

    // Find or create user
    let user;
    if (validatedData.userId) {
      user = await prisma.user.findUnique({
        where: { id: validatedData.userId },
      });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    } else if (validatedData.customerEmail) {
      user = await prisma.user.findUnique({
        where: { email: validatedData.customerEmail },
      });

      if (!user) {
        // Create user without password - they can set it later via password reset
        user = await prisma.user.create({
          data: {
            email: validatedData.customerEmail,
            name: validatedData.customerName || validatedData.customerEmail.split("@")[0],
            phoneNo: validatedData.customerPhone || null,
            role: DEFAULT_USER_ROLE,
          },
        });
      }
    } else {
      return NextResponse.json({ error: "Either userId or customerEmail must be provided" }, { status: 400 });
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        productId: validatedData.productId,
        amount: product.price,
        currency: "IDR", // Midtrans requires IDR
        status: TRANSACTION_STATUS.PENDING,
        paymentProvider: "midtrans",
        metadata: {
          customerEmail: user.email,
          customerName: user.name,
          customerPhone: user.phoneNo || null,
          createdBy: "admin", // Mark as admin-created purchase
        },
      },
    });

    // Calculate expiration date
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + product.validDays);

    // Create membership with PENDING status until payment is confirmed
    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        productId: validatedData.productId,
        expiredAt,
        transactionId: transaction.id,
        status: MEMBERSHIP_STATUS.PENDING,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            validDays: true,
            paymentUrl: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create Midtrans Snap token
    let snapToken: string | null = null;
    try {
      const snapResponse = await createSnapTransaction({
        transactionId: transaction.id,
        amount: Number(product.price),
        customerName: user.name || "Customer",
        customerEmail: user.email,
        customerPhone: user.phoneNo || undefined,
        productId: validatedData.productId,
        productName: product.name,
      });

      snapToken = snapResponse.token;

      // Store snap token in transaction metadata
      const updatedMetadata: TransactionMetadata = {
        ...(transaction.metadata as TransactionMetadata),
        snapToken: snapResponse.token,
        snapTokenCreatedAt: new Date().toISOString(),
      };

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { metadata: JSON.parse(JSON.stringify(updatedMetadata)) },
      });
    } catch (error) {
      console.error("Failed to create Snap token:", error);
      // Return error but don't fail the entire request
      // Transaction and membership are created, user can retry later
      return NextResponse.json(
        {
          error: "Failed to initialize payment gateway",
          details: error instanceof Error ? error.message : "Unknown error",
          transaction: {
            id: transaction.id,
            status: transaction.status,
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        snapToken,
        transaction: {
          id: transaction.id,
          status: transaction.status,
          amount: Number(transaction.amount),
          currency: transaction.currency,
        },
        membership: {
          id: membership.id,
          status: membership.status,
          expiredAt: membership.expiredAt,
          product: membership.product,
          user: membership.user,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }

    console.error("Failed to process admin purchase:", error);
    return NextResponse.json({ error: "Failed to process purchase" }, { status: 500 });
  }
}
