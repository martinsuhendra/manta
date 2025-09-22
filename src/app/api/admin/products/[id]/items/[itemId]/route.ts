import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, itemId } = await params;

    // Check if product item exists and has quota usage
    const productItem = await prisma.productItem.findUnique({
      where: {
        productId_itemId: {
          productId: id,
          itemId: itemId,
        },
      },
      include: {
        _count: {
          select: {
            membershipQuotaUsage: true,
          },
        },
        item: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!productItem) {
      return NextResponse.json({ error: "Product item not found" }, { status: 404 });
    }

    if (productItem._count.membershipQuotaUsage > 0) {
      return NextResponse.json(
        {
          error: `Cannot remove ${productItem.item.name} as it has existing quota usage. Members are using this item.`,
        },
        { status: 400 },
      );
    }

    await prisma.productItem.delete({
      where: {
        productId_itemId: {
          productId: id,
          itemId: itemId,
        },
      },
    });

    return NextResponse.json({ message: "Product item removed successfully" });
  } catch (error: unknown) {
    console.error("Error deleting product item:", error);

    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Product item not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
