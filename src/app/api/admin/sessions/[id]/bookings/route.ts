/* eslint-disable complexity, @typescript-eslint/no-unnecessary-condition */
import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

const addParticipantSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  membershipId: z.string().uuid("Invalid membership ID"),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN].includes(session.user.role as "ADMIN" | "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: sessionId } = await params;

    // Get session details with item
    const classSession = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        item: true,
      },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get all members with their active memberships
    const members = await prisma.user.findMany({
      where: {
        role: USER_ROLES.MEMBER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        memberships: {
          where: {
            status: "ACTIVE",
            expiredAt: {
              gt: new Date(),
            },
          },
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

    // Transform members to include eligibility info
    const eligibleMembers = members.map((member) => ({
      ...member,
      memberships: member.memberships.map((membership) => {
        const productItem = membership.product.productItems[0] ?? null;

        if (!productItem) {
          return {
            ...membership,
            isEligible: false,
            reason: "Membership does not include this class type",
            remainingQuota: 0,
          };
        }

        // Check quota based on type
        let isEligible = true;
        let remainingQuota = Infinity;
        let reason = "";

        if (productItem.quotaType === "FREE") {
          isEligible = true;
          remainingQuota = Infinity;
        } else if (productItem.quotaType === "INDIVIDUAL") {
          const quotaUsage = membership.quotaUsage.find((usage) => usage.productItemId === productItem.id);
          const usedCount = quotaUsage?.usedCount || 0;
          remainingQuota = (productItem.quotaValue || 0) - usedCount;
          isEligible = remainingQuota > 0;
          if (!isEligible) {
            reason = "No remaining quota for this class";
          }
        } else if (productItem.quotaType === "SHARED" && productItem.quotaPoolId) {
          const quotaUsage = membership.quotaUsage.find((usage) => usage.quotaPoolId === productItem.quotaPoolId);
          const usedCount = quotaUsage?.usedCount || 0;
          remainingQuota = (productItem.quotaPool?.totalQuota || 0) - usedCount;
          isEligible = remainingQuota > 0;
          if (!isEligible) {
            reason = "No remaining quota in pool";
          }
        }

        return {
          id: membership.id,
          userId: membership.userId,
          productId: membership.productId,
          status: membership.status,
          expiredAt: membership.expiredAt,
          product: {
            id: membership.product.id,
            name: membership.product.name,
          },
          isEligible,
          reason,
          remainingQuota: remainingQuota === Infinity ? null : remainingQuota,
        };
      }),
    }));

    return NextResponse.json(eligibleMembers);
  } catch (error) {
    console.error("Error fetching eligible members:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN].includes(session.user.role as "ADMIN" | "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: sessionId } = await params;
    const body = await request.json();
    const validatedData = addParticipantSchema.parse(body);
    const { userId, membershipId } = validatedData;

    // Check if session exists
    const classSession = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        item: true,
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  not: "CANCELLED",
                },
              },
            },
          },
        },
      },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check capacity
    if (classSession._count.bookings >= classSession.item.capacity) {
      return NextResponse.json({ error: "Session is at full capacity" }, { status: 400 });
    }

    // Check if user exists and has MEMBER role
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== USER_ROLES.MEMBER) {
      return NextResponse.json({ error: "User must have MEMBER role" }, { status: 400 });
    }

    // Check if user is already booked
    const existingBooking = await prisma.booking.findUnique({
      where: {
        classSessionId_userId: {
          classSessionId: sessionId,
          userId,
        },
      },
    });

    if (existingBooking) {
      return NextResponse.json({ error: "Member is already booked for this session" }, { status: 400 });
    }

    // Validate membership
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
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
    });

    if (!membership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    if (membership.userId !== userId) {
      return NextResponse.json({ error: "Membership does not belong to user" }, { status: 400 });
    }

    if (membership.status !== "ACTIVE") {
      return NextResponse.json({ error: "Membership is not active" }, { status: 400 });
    }

    if (membership.expiredAt <= new Date()) {
      return NextResponse.json({ error: "Membership has expired" }, { status: 400 });
    }

    // Check if product includes this item
    const productItem = membership.product.productItems[0] ?? null;

    if (!productItem) {
      return NextResponse.json({ error: "Membership does not include this class type" }, { status: 400 });
    }

    // Validate quota based on type
    if (productItem.quotaType === "INDIVIDUAL") {
      const quotaUsage = membership.quotaUsage.find((usage) => usage.productItemId === productItem.id);
      const usedCount = quotaUsage?.usedCount || 0;
      const quotaValue = productItem.quotaValue || 0;

      if (usedCount >= quotaValue) {
        return NextResponse.json({ error: "No remaining quota for this class" }, { status: 400 });
      }
    } else if (productItem.quotaType === "SHARED") {
      const quotaUsage = membership.quotaUsage.find((usage) => usage.quotaPoolId === productItem.quotaPoolId);
      const usedCount = quotaUsage?.usedCount || 0;
      const totalQuota = productItem.quotaPool?.totalQuota || 0;

      if (usedCount >= totalQuota) {
        return NextResponse.json({ error: "No remaining quota in pool" }, { status: 400 });
      }
    }
    // FREE quota type doesn't need validation

    // Create booking and update quota usage in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create booking
      const booking = await tx.booking.create({
        data: {
          userId,
          classSessionId: sessionId,
          membershipId,
          status: "CONFIRMED",
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
            select: {
              id: true,
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Update quota usage if not FREE
      if (productItem.quotaType === "INDIVIDUAL") {
        await tx.membershipQuotaUsage.upsert({
          where: {
            membershipId_productItemId: {
              membershipId,
              productItemId: productItem.id,
            },
          },
          create: {
            membershipId,
            productItemId: productItem.id,
            usedCount: 1,
          },
          update: {
            usedCount: {
              increment: 1,
            },
          },
        });
      } else if (productItem.quotaType === "SHARED") {
        await tx.membershipQuotaUsage.upsert({
          where: {
            membershipId_quotaPoolId: {
              membershipId,
              quotaPoolId: productItem.quotaPoolId!,
            },
          },
          create: {
            membershipId,
            quotaPoolId: productItem.quotaPoolId,
            usedCount: 1,
          },
          update: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      return booking;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }

    console.error("Error adding participant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
