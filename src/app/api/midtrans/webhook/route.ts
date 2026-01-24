import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/generated/prisma";
import { TRANSACTION_STATUS } from "@/lib/midtrans/constants";
import { InvalidSignatureError, MidtransAPIError } from "@/lib/midtrans/errors";
import type { MidtransNotification } from "@/lib/midtrans/types";
import {
  sendPaymentSuccessEmail,
  updateMembershipStatus,
  updateTransaction,
  verifyWebhook,
} from "@/lib/midtrans/webhook-service";

/**
 * Midtrans Payment Webhook Handler
 * Receives notifications from Midtrans about transaction status changes
 * Implements security best practices:
 * 1. Signature verification
 * 2. Status verification with Midtrans API
 * 3. Idempotency handling
 */
export async function POST(request: NextRequest) {
  try {
    const notification: MidtransNotification = await request.json();

    console.log("Webhook received:", {
      order_id: notification.order_id,
      transaction_status: notification.transaction_status,
      status_code: notification.status_code,
    });

    // Verify signature and get verified status from Midtrans API
    const newStatus = await verifyWebhook(notification);

    // Find transaction in database
    const transaction = await prisma.transaction.findUnique({
      where: { id: notification.order_id },
      include: {
        user: true,
        product: true,
        memberships: true,
      },
    });

    if (!transaction) {
      console.error("Transaction not found:", notification.order_id);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Idempotency check - skip if status hasn't changed
    if (transaction.status === newStatus) {
      console.log("Status unchanged, skipping:", {
        transaction_id: transaction.id,
        status: newStatus,
      });
      return NextResponse.json({ success: true, message: "Status unchanged" });
    }

    // Update transaction
    const updatedTransaction = await updateTransaction(transaction.id, newStatus, notification, transaction.metadata);

    console.log("Transaction updated:", {
      transaction_id: transaction.id,
      old_status: transaction.status,
      new_status: newStatus,
    });

    // Update memberships based on new status
    const membershipUpdate = await updateMembershipStatus(transaction.id, newStatus);

    console.log("Memberships updated:", {
      transaction_id: transaction.id,
      count: membershipUpdate.count,
      status: newStatus,
    });

    // Send email for successful payments
    if (newStatus === TRANSACTION_STATUS.COMPLETED) {
      await sendPaymentSuccessEmail(transaction);
    }

    return NextResponse.json({
      success: true,
      transaction_id: updatedTransaction.id,
      status: updatedTransaction.status,
    });
  } catch (error) {
    console.error("Webhook processing failed:", error);

    if (error instanceof InvalidSignatureError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    if (error instanceof MidtransAPIError) {
      return NextResponse.json({ error: "Failed to verify transaction" }, { status: 500 });
    }

    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
