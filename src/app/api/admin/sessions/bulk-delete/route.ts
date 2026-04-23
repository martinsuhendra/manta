import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAdmin } from "@/lib/api-utils";
import { doesBookingStatusConsumeQuota } from "@/lib/booking-status";
import { prisma } from "@/lib/generated/prisma";
import { restoreQuota } from "@/lib/quota-utils";

const bulkDeleteSessionsSchema = z.object({
  sessionIds: z.array(z.string().min(1)).min(1, "At least one session is required"),
});

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { sessionIds } = bulkDeleteSessionsSchema.parse(body);

    const uniqueSessionIds = Array.from(new Set(sessionIds));
    const sessions = await prisma.classSession.findMany({
      where: {
        id: {
          in: uniqueSessionIds,
        },
      },
      select: {
        id: true,
        itemId: true,
      },
    });

    if (sessions.length !== uniqueSessionIds.length) {
      return NextResponse.json({ error: "One or more sessions were not found" }, { status: 404 });
    }

    const itemIdBySessionId = new Map(sessions.map((session) => [session.id, session.itemId]));

    const result = await prisma.$transaction(async (tx) => {
      const bookings = await tx.booking.findMany({
        where: {
          classSessionId: {
            in: uniqueSessionIds,
          },
        },
        include: {
          membership: {
            include: {
              product: {
                include: {
                  // Include inactive items so historical bookings still map correctly for refund.
                  productItems: {
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

      let refundedBookings = 0;
      let skippedRefunds = 0;

      for (const booking of bookings) {
        if (!doesBookingStatusConsumeQuota(booking.status)) {
          skippedRefunds += 1;
          continue;
        }

        const itemId = itemIdBySessionId.get(booking.classSessionId);
        if (!itemId) {
          throw new Error(`Cannot refund quota: missing session item mapping for booking ${booking.id}`);
        }

        const productItem = booking.membership.product.productItems.find((item) => item.itemId === itemId);
        if (!productItem) {
          throw new Error(`Cannot refund quota: missing product item mapping for booking ${booking.id}`);
        }

        await restoreQuota({
          tx,
          membershipId: booking.membershipId,
          productItem,
        });
        refundedBookings += 1;
      }

      const { count: deletedBookings } = await tx.booking.deleteMany({
        where: {
          classSessionId: {
            in: uniqueSessionIds,
          },
        },
      });

      const { count: deletedSessions } = await tx.classSession.deleteMany({
        where: {
          id: {
            in: uniqueSessionIds,
          },
        },
      });

      return {
        deletedSessions,
        deletedBookings,
        refundedBookings,
        skippedRefunds,
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleApiError(error, "Failed to bulk delete sessions");
  }
}
