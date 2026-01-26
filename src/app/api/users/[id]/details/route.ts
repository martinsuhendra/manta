import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and SUPERADMIN can access user details
    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN].includes(session.user.role as "ADMIN" | "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phoneNo: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                validDays: true,
              },
            },
            transaction: {
              select: {
                id: true,
                status: true,
                amount: true,
                currency: true,
                paidAt: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        transactions: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        bookings: {
          include: {
            classSession: {
              include: {
                item: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            membership: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            memberships: true,
            transactions: true,
            bookings: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 });
  }
}
