import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

const createMembershipSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  productId: z.string().uuid("Invalid product ID"),
  status: z.enum(["ACTIVE", "FREEZED", "EXPIRED", "SUSPENDED", "PENDING"]).default("ACTIVE"),
  joinDate: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN].includes(session.user.role as "ADMIN" | "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const memberships = await prisma.membership.findMany({
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
            price: true,
            validDays: true,
          },
        },
        transaction: {
          select: {
            id: true,
            status: true,
            amount: true,
            paidAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(memberships);
  } catch (error) {
    console.error("Error fetching memberships:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN].includes(session.user.role as "ADMIN" | "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createMembershipSchema.parse(body);

    // Get product details to calculate expiration and quota
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate expiration date from start date (joinDate) or current date
    const startDate = validatedData.joinDate ? new Date(validatedData.joinDate) : new Date();
    const expiredAt = new Date(startDate);
    expiredAt.setDate(expiredAt.getDate() + product.validDays);

    const membership = await prisma.membership.create({
      data: {
        userId: validatedData.userId,
        productId: validatedData.productId,
        status: validatedData.status,
        joinDate: validatedData.joinDate ? new Date(validatedData.joinDate) : undefined,
        expiredAt,
      },
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
            price: true,
            validDays: true,
          },
        },
      },
    });

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }

    console.error("Error creating membership:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
