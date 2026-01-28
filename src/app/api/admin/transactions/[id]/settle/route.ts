import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { requireAdmin } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";
import { MEMBERSHIP_STATUS, TRANSACTION_STATUS } from "@/lib/midtrans/constants";

const settleTransactionSchema = z.object({
  paymentMethod: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const { paymentMethod } = settleTransactionSchema.parse(body);

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        memberships: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Check if transaction is already completed
    if (transaction.status === TRANSACTION_STATUS.COMPLETED) {
      return NextResponse.json({ error: "Transaction is already completed" }, { status: 400 });
    }

    // Update transaction and activate memberships in a transaction
    await prisma.$transaction(async (tx) => {
      // Update transaction to COMPLETED
      await tx.transaction.update({
        where: { id },
        data: {
          status: TRANSACTION_STATUS.COMPLETED,
          paidAt: new Date(),
          paymentMethod: paymentMethod || "Manual",
          paymentProvider: "manual",
        },
      });

      // Activate associated memberships
      await tx.membership.updateMany({
        where: {
          transactionId: id,
          status: { in: [MEMBERSHIP_STATUS.PENDING, MEMBERSHIP_STATUS.SUSPENDED] },
        },
        data: {
          status: MEMBERSHIP_STATUS.ACTIVE,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Transaction settled successfully",
    });
  } catch (error) {
    console.error("Failed to settle transaction:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to settle transaction", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
