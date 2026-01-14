import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { prisma } from "@/lib/generated/prisma";

const webhookSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID"),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED", "REFUNDED", "EXPIRED"]),
  paidAt: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = webhookSchema.parse(body);

    // Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: validatedData.transactionId },
      include: {
        memberships: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: validatedData.transactionId },
      data: {
        status: validatedData.status,
        paidAt: validatedData.paidAt ? new Date(validatedData.paidAt) : undefined,
      },
    });

    // If payment is completed, activate all associated memberships
    if (validatedData.status === "COMPLETED") {
      await prisma.membership.updateMany({
        where: {
          transactionId: validatedData.transactionId,
          status: { in: ["PENDING", "SUSPENDED"] }, // Update from PENDING or SUSPENDED
        },
        data: {
          status: "ACTIVE",
        },
      });
    }

    // If payment is processing, update PENDING memberships to stay PENDING (or could keep as is)
    if (validatedData.status === "PROCESSING") {
      // Keep as PENDING - no change needed
    }

    // If payment failed, cancelled, or expired, set memberships to SUSPENDED
    if (["FAILED", "CANCELLED", "EXPIRED"].includes(validatedData.status)) {
      await prisma.membership.updateMany({
        where: {
          transactionId: validatedData.transactionId,
          status: { in: ["PENDING", "ACTIVE"] }, // Update from PENDING or ACTIVE
        },
        data: {
          status: "SUSPENDED",
        },
      });
    }

    // If refunded, suspend the membership
    if (validatedData.status === "REFUNDED") {
      await prisma.membership.updateMany({
        where: {
          transactionId: validatedData.transactionId,
        },
        data: {
          status: "SUSPENDED",
        },
      });
    }

    return NextResponse.json({ success: true, transaction: updatedTransaction }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }

    console.error("Failed to process payment webhook:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}
