/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api-utils";
import { emailService } from "@/lib/email/service";
import { createSessionJoinedTemplate } from "@/lib/email/templates";
import { prisma } from "@/lib/generated/prisma";

import { restoreQuota, checkQuotaAvailability, deductQuota } from "./quota-helpers";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; bookingId: string }> }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id: sessionId, bookingId } = await params;

    // Validate session exists with item and teacher info
    const classSession = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
        teacher: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get booking with all necessary relations
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
            quotaUsage: true,
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
    const wasConfirmed = booking.status === "CONFIRMED";

    // Delete booking, restore quota, and auto-confirm waitlisted member in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete the booking
      await tx.booking.delete({
        where: { id: bookingId },
      });

      // Only restore quota if booking was CONFIRMED (not WAITLISTED)
      if (wasConfirmed && productItem) {
        await restoreQuota({
          tx,
          booking: { membershipId: booking.membershipId },
          productItem: {
            id: productItem.id,
            quotaType: productItem.quotaType,
            quotaPoolId: productItem.quotaPoolId,
          },
        });
      }

      // Check if there's a waitlisted member to auto-confirm
      const confirmedCount = await tx.booking.count({
        where: {
          classSessionId: sessionId,
          status: "CONFIRMED",
        },
      });

      // If there's space and a waitlisted member, confirm the first one
      if (confirmedCount < classSession.item.capacity) {
        const firstWaitlisted = await tx.booking.findFirst({
          where: {
            classSessionId: sessionId,
            status: "WAITLISTED",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
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
                quotaUsage: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc", // First come, first served
          },
        });

        if (firstWaitlisted) {
          const waitlistedProductItem = firstWaitlisted.membership.product.productItems[0];

          if (!waitlistedProductItem) {
            return { waitlistedConfirmed: null };
          }

          // Check quota availability before confirming
          const hasQuota = checkQuotaAvailability({
            productItem: {
              id: waitlistedProductItem.id,
              quotaType: waitlistedProductItem.quotaType,
              quotaValue: waitlistedProductItem.quotaValue,
              quotaPoolId: waitlistedProductItem.quotaPoolId,
              quotaPool: waitlistedProductItem.quotaPool,
            },
            quotaUsage: firstWaitlisted.membership.quotaUsage,
          });

          // Only confirm if quota is available
          if (hasQuota) {
            // Update booking status to CONFIRMED
            await tx.booking.update({
              where: { id: firstWaitlisted.id },
              data: { status: "CONFIRMED" },
            });

            // Deduct quota for the newly confirmed member
            await deductQuota({
              tx,
              membershipId: firstWaitlisted.membershipId,
              productItem: {
                id: waitlistedProductItem.id,
                quotaType: waitlistedProductItem.quotaType,
                quotaPoolId: waitlistedProductItem.quotaPoolId,
              },
            });

            return { waitlistedConfirmed: firstWaitlisted };
          }
        }
      }

      return { waitlistedConfirmed: null };
    });

    // Send email to newly confirmed waitlisted member
    if (result.waitlistedConfirmed?.user.email) {
      try {
        const sessionInfo = {
          itemName: classSession.item.name,
          date: classSession.date.toISOString(),
          startTime: classSession.startTime,
          endTime: classSession.endTime,
          teacher: classSession.teacher
            ? {
                name: classSession.teacher.name,
                email: classSession.teacher.email,
              }
            : null,
          notes: classSession.notes,
        };

        const emailTemplate = createSessionJoinedTemplate(
          sessionInfo,
          result.waitlistedConfirmed.user.name || result.waitlistedConfirmed.user.email,
        );
        await emailService.sendEmail(result.waitlistedConfirmed.user.email, emailTemplate);
      } catch (emailError) {
        console.error("Failed to send waitlist confirmation email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Participant removed successfully",
      waitlistedConfirmed: result.waitlistedConfirmed ? true : false,
    });
  } catch (error) {
    console.error("Error removing participant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
