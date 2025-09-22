import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

import { updateItemSchema } from "../../../../(main)/dashboard/admin/items/_components/schema";

// Helper function to validate request data for updates
function validateUpdateData(body: unknown): {
  data: z.infer<typeof updateItemSchema>;
  schedules?: Array<{ dayOfWeek: number; startTime: string; endTime?: string; isActive: boolean }>;
} {
  const { schedules, ...itemData } = body as Record<string, unknown>;
  const data = updateItemSchema.parse(itemData);
  return {
    data,
    schedules: Array.isArray(schedules)
      ? (schedules as Array<{ dayOfWeek: number; startTime: string; endTime?: string; isActive: boolean }>)
      : undefined,
  };
}

// Helper function to update item schedules
async function updateItemSchedules(
  itemId: string,
  schedules: Array<{ dayOfWeek: number; startTime: string; endTime?: string; isActive: boolean }>,
) {
  // Delete existing schedules
  await prisma.itemSchedule.deleteMany({
    where: { itemId },
  });

  // Create new schedules
  if (schedules.length > 0) {
    await prisma.itemSchedule.createMany({
      data: schedules.map((schedule) => ({
        itemId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime || schedule.startTime,
        isActive: schedule.isActive,
      })),
    });
  }
}

// Helper function to update item data
async function updateItemData(itemId: string, data: z.infer<typeof updateItemSchema>) {
  return await prisma.item.update({
    where: { id: itemId },
    data,
    include: {
      schedules: true,
    },
  });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        schedules: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const { data, schedules } = validateUpdateData(body);

    // Update the item
    await updateItemData(id, data);

    // Update schedules if provided
    if (schedules) {
      await updateItemSchedules(id, schedules);
    }

    // Fetch the updated item with schedules
    const finalItem = await prisma.item.findUnique({
      where: { id },
      include: {
        schedules: true,
      },
    });

    return NextResponse.json(finalItem);
  } catch (error) {
    console.error("Error updating item:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check if item exists
    const item = await prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check if item is used in any products
    const productItems = await prisma.productItem.findMany({
      where: { itemId: id },
      include: {
        product: {
          select: { name: true },
        },
      },
    });

    if (productItems.length > 0) {
      const productNames = productItems.map((pi) => pi.product.name).join(", ");
      return NextResponse.json(
        {
          error: `Cannot delete item "${item.name}" as it is used in the following products: ${productNames}`,
        },
        { status: 400 },
      );
    }

    // Delete the item (schedules will be deleted automatically due to cascade)
    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
