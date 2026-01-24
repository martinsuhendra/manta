/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; bookingId: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.ADMIN && session.user.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: sessionId, bookingId } = await params;

    // Validate session exists
    const classSession = await prisma.classSession.findUnique({
      where: { id: sessionId },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get booking with all necessary relations
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        membership: {
          include: {
            product: {
              include: {
                productItems: {
                  where: {
                    itemId: classSession.itemId,
                    isActive: true,
                  },
                  include: {
                    quotaPool: true,
                  },
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

    // Validate booking belongs to this session
    if (booking.classSessionId !== sessionId) {
      return NextResponse.json({ error: "Booking does not belong to this session" }, { status: 400 });
    }

    const productItem = booking.membership.product.productItems[0];

    // Delete booking and restore quota in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the booking
      await tx.booking.delete({
        where: { id: bookingId },
      });

      // Restore quota based on type
      if (productItem?.quotaType === "INDIVIDUAL") {
        // Decrement usage for individual quota
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
              usedCount: {
                decrement: 1,
              },
            },
          });
        }
      } else if (productItem?.quotaType === "SHARED" && productItem.quotaPoolId) {
        // Decrement usage for shared quota pool
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
              usedCount: {
                decrement: 1,
              },
            },
          });
        }
      }
      // FREE quota type doesn't need any updates
    });

    return NextResponse.json({ success: true, message: "Participant removed successfully" });
  } catch (error) {
    console.error("Error removing participant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
