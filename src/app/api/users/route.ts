import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES, DEFAULT_USER_ROLE } from "@/lib/types";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z
    .enum([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.MEMBER, USER_ROLES.TEACHER])
    .default(DEFAULT_USER_ROLE),
  phoneNo: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const whereCondition: { role?: string } = {};

    // Add role filter if provided
    if (role && Object.values(USER_ROLES).includes(role as (typeof USER_ROLES)[keyof typeof USER_ROLES])) {
      whereCondition.role = role;
    }

    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phoneNo: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            memberships: true,
            transactions: true,
            bookings: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Check if only SUPERADMIN can create SUPERADMIN users
    if (validatedData.role === USER_ROLES.SUPERADMIN && session.user.role !== USER_ROLES.SUPERADMIN) {
      return NextResponse.json({ error: "Only SUPERADMIN users can create SUPERADMIN accounts" }, { status: 403 });
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
        phoneNo: validatedData.phoneNo,
      },
      include: {
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }

    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
