import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

const reorderProductsSchema = z.object({
  productIds: z.array(z.string()),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { productIds } = reorderProductsSchema.parse(body);

    // Update positions in a transaction
    await prisma.$transaction(
      productIds.map((productId, index) =>
        prisma.product.update({
          where: { id: productId },
          data: { position: index },
        }),
      ),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }

    console.error("Failed to reorder products:", error);
    return NextResponse.json({ error: "Failed to reorder products" }, { status: 500 });
  }
}
