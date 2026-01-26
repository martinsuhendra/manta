import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.MEMBER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = session.user.id;
    const { bookingId } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        classSession: { select: { itemId: true } },
        membership: {
          include: {
            product: {
              include: {
                productItems: {
                  where: { isActive: true },
                  include: { quotaPool: true },
                },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== userId) {
      return NextResponse.json({ error: "You can only cancel your own bookings" }, { status: 403 });
    }

    const itemId = booking.classSession.itemId;
    const productItem = booking.membership.product.productItems.find((pi) => pi.itemId === itemId) ?? null;

    await prisma.$transaction(async (tx) => {
      await tx.booking.delete({
        where: { id: bookingId },
      });

      if (productItem?.quotaType === "INDIVIDUAL") {
        const quotaUsage = await tx.membershipQuotaUsage.findUnique({
          where: {
            membershipId_productItemId: {
              membershipId: booking.membershipId,
              productItemId: productItem.id,
            },
          },
        });

        if (quotaUsage && quotaUsage.usedCount > 0) {
          await tx.membershipQuotaUsage.update({
            where: {
              membershipId_productItemId: {
                membershipId: booking.membershipId,
                productItemId: productItem.id,
              },
            },
            data: {
              usedCount: { decrement: 1 },
            },
          });
        }
      } else if (productItem?.quotaType === "SHARED" && productItem.quotaPoolId) {
        const quotaUsage = await tx.membershipQuotaUsage.findUnique({
          where: {
            membershipId_quotaPoolId: {
              membershipId: booking.membershipId,
              quotaPoolId: productItem.quotaPoolId,
            },
          },
        });

        if (quotaUsage && quotaUsage.usedCount > 0) {
          await tx.membershipQuotaUsage.update({
            where: {
              membershipId_quotaPoolId: {
                membershipId: booking.membershipId,
                quotaPoolId: productItem.quotaPoolId,
              },
            },
            data: {
              usedCount: { decrement: 1 },
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
