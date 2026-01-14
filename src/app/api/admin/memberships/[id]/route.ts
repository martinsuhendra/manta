import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

const updateMembershipSchema = z.object({
  status: z.enum(["ACTIVE", "EXPIRED", "SUSPENDED", "PENDING"]).optional(),
  remainingQuota: z.number().min(0).optional(),
  expiredAt: z.string().datetime().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: membershipId } = await params;
    const body = await request.json();
    const validatedData = updateMembershipSchema.parse(body);

    // Check if membership exists
    const existingMembership = await prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!existingMembership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (validatedData.status) {
      updateData.status = validatedData.status;
    }

    if (validatedData.remainingQuota !== undefined) {
      updateData.remainingQuota = validatedData.remainingQuota;
    }

    if (validatedData.expiredAt) {
      updateData.expiredAt = new Date(validatedData.expiredAt);
    }

    const membership = await prisma.membership.update({
      where: { id: membershipId },
      data: updateData,
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
    });

    return NextResponse.json(membership);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }

    console.error("Error updating membership:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: membershipId } = await params;

    // Check if membership exists
    const existingMembership = await prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!existingMembership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    await prisma.membership.delete({
      where: { id: membershipId },
    });

    return NextResponse.json({ message: "Membership deleted successfully" });
  } catch (error) {
    console.error("Error deleting membership:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
