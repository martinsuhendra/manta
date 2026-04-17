import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { parseCloudinaryAsset, resolveAssetUrl } from "@/lib/cloudinary-asset";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES, DEFAULT_USER_ROLE } from "@/lib/types";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z
    .enum([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER, USER_ROLES.MEMBER, USER_ROLES.TEACHER])
    .default(DEFAULT_USER_ROLE),
  phoneNo: z
    .string()
    .min(1, "Phone number is required")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
  image: z.string().nullable().optional(),
  avatarAsset: z.unknown().nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const whereCondition: { role?: string | { not: string } } = { role: { not: USER_ROLES.DEVELOPER } };

    // Add role filter if provided
    if (role && role !== USER_ROLES.DEVELOPER && Object.values(USER_ROLES).includes(role)) {
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
    const avatarAsset = parseCloudinaryAsset(validatedData.avatarAsset);

    // Check if only SUPERADMIN can create SUPERADMIN users
    if (
      [USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(validatedData.role) &&
      session.user.role !== USER_ROLES.DEVELOPER
    ) {
      return NextResponse.json(
        { error: "Only DEVELOPER users can create SUPERADMIN or DEVELOPER accounts" },
        { status: 403 },
      );
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: { id: true },
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
        avatarAsset: avatarAsset ?? Prisma.JsonNull,
        image: resolveAssetUrl(avatarAsset, validatedData.image) ?? undefined,
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
