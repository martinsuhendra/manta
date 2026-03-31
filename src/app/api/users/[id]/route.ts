import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";
import { parseCloudinaryAsset, resolveAssetUrl } from "@/lib/cloudinary-asset";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
  role: z
    .enum([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER, USER_ROLES.MEMBER, USER_ROLES.TEACHER])
    .optional(),
  phoneNo: z
    .string()
    .min(1, "Phone number is required")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format")
    .optional(),
  image: z.string().nullable().optional(),
  avatarAsset: z.unknown().nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phoneNo: true,
        image: true,
        avatarAsset: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...user,
      avatarAsset: parseCloudinaryAsset(user.avatarAsset),
      image: resolveAssetUrl(user.avatarAsset, user.image),
    });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);
    const { avatarAsset: _avatarAsset, ...updateData } = validatedData;

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, avatarAsset: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const previousAsset = parseCloudinaryAsset(targetUser.avatarAsset);
    const nextAsset =
      validatedData.avatarAsset === undefined ? previousAsset : parseCloudinaryAsset(validatedData.avatarAsset);
    const nextAssetForDb =
      validatedData.avatarAsset === undefined ? undefined : nextAsset ? nextAsset : Prisma.JsonNull;
    const shouldDeletePrevious =
      !!previousAsset &&
      (!nextAsset ||
        previousAsset.publicId !== nextAsset.publicId ||
        validatedData.avatarAsset === null ||
        validatedData.image === null);

    // Check if trying to update role and if user has permission
    if (validatedData.role && session.user.role !== USER_ROLES.DEVELOPER) {
      return NextResponse.json({ error: "Only DEVELOPER users can edit user roles" }, { status: 403 });
    }

    // Check email uniqueness if email is being updated
    if (validatedData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { not: id },
        },
      });

      if (existingUser) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 });
      }
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        ...(validatedData.avatarAsset !== undefined && {
          avatarAsset: nextAssetForDb,
          image: resolveAssetUrl(nextAsset, validatedData.image),
        }),
      },
      include: {
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    });

    if (shouldDeletePrevious && previousAsset) {
      deleteCloudinaryAsset({ publicId: previousAsset.publicId }).catch((error: unknown) => {
        console.warn("Failed to delete previous Cloudinary user avatar:", error);
      });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }

    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, avatarAsset: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if trying to delete SUPERADMIN user
    if (
      [USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(targetUser.role) &&
      session.user.role !== USER_ROLES.DEVELOPER
    ) {
      return NextResponse.json(
        { error: "Only DEVELOPER users can delete SUPERADMIN or DEVELOPER accounts" },
        { status: 403 },
      );
    }

    // Prevent users from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Delete the user
    await prisma.user.delete({
      where: { id },
    });

    const avatarAsset = parseCloudinaryAsset(targetUser.avatarAsset);
    if (avatarAsset) {
      deleteCloudinaryAsset({ publicId: avatarAsset.publicId }).catch((error: unknown) => {
        console.warn("Failed to delete Cloudinary avatar during user deletion:", error);
      });
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
