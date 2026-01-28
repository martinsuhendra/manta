import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";
import { SNAP_TOKEN_EXPIRY_MS, TRANSACTION_STATUS } from "@/lib/midtrans/constants";
import { createSnapTransaction } from "@/lib/midtrans/snap";
import type { TransactionMetadata } from "@/lib/midtrans/types";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: true,
        product: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Check if transaction is still pending
    if (transaction.status !== TRANSACTION_STATUS.PENDING) {
      return NextResponse.json(
        { error: "Transaction is no longer pending", status: transaction.status },
        { status: 400 },
      );
    }

    // Check for existing valid snap token
    const metadata = transaction.metadata as TransactionMetadata | null;
    const existingToken = getValidSnapToken(metadata);

    if (existingToken) {
      return NextResponse.json({
        snapToken: existingToken,
        isNew: false,
      });
    }

    // Create new snap token
    const snapResponse = await createSnapTransaction({
      transactionId: transaction.id,
      amount: Number(transaction.amount),
      customerName: transaction.user.name || "Customer",
      customerEmail: transaction.user.email || "",
      customerPhone: transaction.user.phoneNo || undefined,
      productId: transaction.product.id,
      productName: transaction.product.name,
    });

    // Update transaction metadata with new token
    const updatedMetadata: TransactionMetadata = {
      ...(metadata || {}),
      snapToken: snapResponse.token,
      snapTokenCreatedAt: new Date().toISOString(),
    };

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { metadata: JSON.parse(JSON.stringify(updatedMetadata)) },
    });

    return NextResponse.json({
      snapToken: snapResponse.token,
      isNew: true,
    });
  } catch (error) {
    console.error("Failed to get snap token:", error);
    return NextResponse.json(
      { error: "Failed to get payment token", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

/**
 * Get valid snap token from metadata if it exists and hasn't expired
 */
function getValidSnapToken(metadata: TransactionMetadata | null): string | null {
  if (!metadata?.snapToken || !metadata.snapTokenCreatedAt) {
    return null;
  }

  const tokenCreatedAt = new Date(metadata.snapTokenCreatedAt);
  const isExpired = Date.now() - tokenCreatedAt.getTime() > SNAP_TOKEN_EXPIRY_MS;

  return isExpired ? null : metadata.snapToken;
}
