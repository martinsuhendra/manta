import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNo: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        memberships: {
          select: {
            id: true,
            status: true,
            joinDate: true,
            expiredAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    return NextResponse.json({
      id: transaction.id,
      name: transaction.user.name ?? "",
      email: transaction.user.email,
      phoneNo: transaction.user.phoneNo,
      userId: transaction.user.id,
      userName: transaction.user.name ?? transaction.user.email ?? "Unknown User",
      productName: transaction.product.name,
      productId: transaction.product.id,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      paymentProvider: transaction.paymentProvider,
      externalId: transaction.externalId,
      metadata: (transaction.metadata as Record<string, unknown> | null) ?? null,
      paidAt: transaction.paidAt?.toISOString() ?? null,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      memberships: transaction.memberships.map((membership) => ({
        id: membership.id,
        status: membership.status,
        joinDate: membership.joinDate.toISOString(),
        expiredAt: membership.expiredAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch transaction detail:", error);
    return NextResponse.json({ error: "Failed to fetch transaction detail" }, { status: 500 });
  }
}
