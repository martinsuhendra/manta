import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN].includes(session.user.role as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sessionData = await prisma.classSession.findUnique({
      where: { id },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            duration: true,
            capacity: true,
            color: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(sessionData);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN].includes(session.user.role as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingSession = await prisma.classSession.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const body = await request.json();
    const { itemId, teacherId, date, startTime, endTime, status, notes } = body;

    // If updating core session details, validate them
    if (itemId && itemId !== existingSession.itemId) {
      const item = await prisma.item.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
    }

    // If teacher is provided, validate that the teacher exists and has TEACHER role
    if (teacherId && teacherId !== existingSession.teacherId) {
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
      });

      if (!teacher) {
        return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
      }

      if (teacher.role !== USER_ROLES.TEACHER) {
        return NextResponse.json({ error: "Selected user must have TEACHER role" }, { status: 400 });
      }
    }

    // Check for conflicts if changing core session details
    if (
      (itemId && itemId !== existingSession.itemId) ||
      (date && new Date(date).getTime() !== existingSession.date.getTime()) ||
      (startTime && startTime !== existingSession.startTime)
    ) {
      const conflictSession = await prisma.classSession.findFirst({
        where: {
          id: { not: id },
          itemId: itemId || existingSession.itemId,
          date: date ? new Date(date) : existingSession.date,
          startTime: startTime || existingSession.startTime,
        },
      });

      if (conflictSession) {
        return NextResponse.json(
          { error: "A session already exists for this item at this date and time" },
          { status: 409 },
        );
      }
    }

    const updatedSession = await prisma.classSession.update({
      where: { id },
      data: {
        ...(itemId && { itemId }),
        ...(teacherId !== undefined && { teacherId: teacherId || null }),
        ...(date && { date: new Date(date) }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(status && { status }),
        ...(notes !== undefined && { notes: notes || null }),
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            duration: true,
            capacity: true,
            color: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN].includes(session.user.role as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingSession = await prisma.classSession.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if session has bookings
    if (existingSession._count.bookings > 0) {
      return NextResponse.json(
        { error: "Cannot delete session with existing bookings. Cancel the session instead." },
        { status: 400 },
      );
    }

    await prisma.classSession.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
