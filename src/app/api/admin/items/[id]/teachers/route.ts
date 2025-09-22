import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

import { createTeacherItemSchema } from "../../../../../(main)/dashboard/admin/items/_components/schema";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const teacherItems = await prisma.teacherItem.findMany({
      where: { itemId: id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        item: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(teacherItems);
  } catch (error) {
    console.error("Error fetching teacher items:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const validatedData = createTeacherItemSchema.parse({
      ...body,
      itemId: id,
    });

    // Check if teacher exists and has TEACHER role
    const teacher = await prisma.user.findUnique({
      where: { id: validatedData.teacherId },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    if (teacher.role !== USER_ROLES.TEACHER) {
      return NextResponse.json({ error: "User must have TEACHER role" }, { status: 400 });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.teacherItem.findUnique({
      where: {
        teacherId_itemId: {
          teacherId: validatedData.teacherId,
          itemId: id,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json({ error: "Teacher is already assigned to this item" }, { status: 400 });
    }

    const teacherItem = await prisma.teacherItem.create({
      data: validatedData,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        item: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(teacherItem, { status: 201 });
  } catch (error) {
    console.error("Error creating teacher item assignment:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
