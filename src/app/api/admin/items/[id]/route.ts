import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { ensureTeacherItems } from "@/lib/items/ensure-teacher-item";
import { USER_ROLES } from "@/lib/types";

import { updateItemSchema } from "../../../../(main)/dashboard/admin/items/_components/schema";

// Helper function to validate request data for updates
function validateUpdateData(body: unknown): {
  data: Omit<z.infer<typeof updateItemSchema>, "brandIds">;
  brandIds?: string[];
  schedules?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime?: string;
    isActive: boolean;
    teacherId?: string | null;
  }>;
} {
  const { schedules, ...itemData } = body as Record<string, unknown>;
  const parsed = updateItemSchema.parse(itemData);
  const { brandIds, ...data } = parsed;
  return {
    data,
    brandIds,
    schedules: Array.isArray(schedules)
      ? (schedules as Array<{
          dayOfWeek: number;
          startTime: string;
          endTime?: string;
          isActive: boolean;
          teacherId?: string | null;
        }>)
      : undefined,
  };
}

// Helper function to update item schedules
async function updateItemSchedules(
  itemId: string,
  schedules: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime?: string;
    isActive: boolean;
    teacherId?: string | null;
  }>,
) {
  await prisma.$transaction(async (tx) => {
    // Delete existing schedules
    await tx.itemSchedule.deleteMany({
      where: { itemId },
    });

    // Create new schedules
    if (schedules.length > 0) {
      await tx.itemSchedule.createMany({
        data: schedules.map((schedule) => ({
          itemId,
          teacherId: schedule.teacherId ?? null,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime || schedule.startTime,
          isActive: schedule.isActive,
        })),
      });
      await ensureTeacherItems({
        tx,
        itemId,
        teacherIds: schedules.map((schedule) => schedule.teacherId),
      });
    }
  });
}

// Helper function to update item data
async function updateItemData(itemId: string, data: Omit<z.infer<typeof updateItemSchema>, "brandIds">) {
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

    if (![USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        schedules: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        itemBrands: {
          select: {
            brandId: true,
            brand: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...item,
      brandIds: item.itemBrands.map((ib) => ib.brandId),
    });
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

    if (![USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const { data, schedules, brandIds } = validateUpdateData(body);

    if (brandIds !== undefined) {
      const brands = await prisma.brand.findMany({
        where: { id: { in: brandIds } },
        select: { id: true },
      });
      if (brands.length !== brandIds.length) {
        return NextResponse.json({ error: "One or more stores not found" }, { status: 400 });
      }
    }

    // Update the item
    await updateItemData(id, data);

    if (brandIds !== undefined) {
      await prisma.$transaction(async (tx) => {
        await tx.itemBrand.deleteMany({ where: { itemId: id } });
        if (brandIds.length > 0) {
          await tx.itemBrand.createMany({
            data: brandIds.map((brandId) => ({ itemId: id, brandId })),
          });
        }
      });
    }

    // Update schedules if provided
    if (schedules) {
      await updateItemSchedules(id, schedules);
    }

    // Fetch the updated item with schedules
    const finalItem = await prisma.item.findUnique({
      where: { id },
      include: {
        schedules: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        itemBrands: {
          select: {
            brandId: true,
            brand: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!finalItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...finalItem,
      brandIds: finalItem.itemBrands.map((ib) => ib.brandId),
    });
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

    if (![USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role)) {
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
