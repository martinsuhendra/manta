import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { handleApiError, requireAuth, requireSuperAdmin } from "@/lib/api-utils";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";
import { parseCloudinaryAsset, resolveAssetUrl } from "@/lib/cloudinary-asset";
import { prisma } from "@/lib/generated/prisma";

const updateProductSchema = z.object({
  brandIds: z.array(z.string().uuid("Invalid brand ID")).min(1, "Select at least one brand").optional(),
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive").optional(),
  validDays: z.number().positive("Valid days must be positive").optional(),
  quota: z.number().positive("Quota must be positive").optional(),
  features: z.array(z.string()).optional(),
  image: z.string().optional(),
  imageAsset: z.unknown().nullable().optional(),
  paymentUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  whatIsIncluded: z.string().optional(),
  participantsPerPurchase: z.number().int().min(1).max(10).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await requireAuth();
    if (error) return error;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productBrands: {
          select: {
            brandId: true,
            brand: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { memberships: true, transactions: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...product,
      brandIds: product.productBrands.map((pb) => pb.brandId),
      brands: product.productBrands.map((pb) => pb.brand),
      imageAsset: parseCloudinaryAsset(product.imageAsset),
      image: resolveAssetUrl(product.imageAsset, product.image),
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch membership product");
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);
    const { brandIds, imageAsset: imageAssetInput, ...updateData } = validatedData;
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { imageAsset: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const previousAsset = parseCloudinaryAsset(existingProduct.imageAsset);
    const nextAsset = imageAssetInput === undefined ? previousAsset : parseCloudinaryAsset(imageAssetInput);
    const nextAssetForDb = imageAssetInput === undefined ? undefined : nextAsset ? nextAsset : Prisma.JsonNull;
    const shouldDeletePrevious =
      !!previousAsset &&
      (!nextAsset ||
        previousAsset.publicId !== nextAsset.publicId ||
        imageAssetInput === null ||
        validatedData.image === "");

    if (brandIds) {
      const brands = await prisma.brand.findMany({
        where: { id: { in: brandIds }, isActive: true },
        select: { id: true },
      });
      if (brands.length !== brandIds.length) {
        return NextResponse.json({ error: "One or more selected brands are invalid or inactive" }, { status: 400 });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        ...(imageAssetInput !== undefined && {
          imageAsset: nextAssetForDb,
          image: resolveAssetUrl(nextAsset, validatedData.image),
        }),
        ...(brandIds && {
          productBrands: {
            deleteMany: {},
            create: brandIds.map((brandId) => ({ brandId })),
          },
        }),
      },
      include: {
        productBrands: {
          select: {
            brandId: true,
            brand: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (shouldDeletePrevious) {
      deleteCloudinaryAsset({ publicId: previousAsset.publicId }).catch((error: unknown) => {
        console.warn("Failed to delete previous Cloudinary product image:", error);
      });
    }

    return NextResponse.json({
      ...product,
      brandIds: product.productBrands.map((pb) => pb.brandId),
      brands: product.productBrands.map((pb) => pb.brand),
    });
  } catch (error) {
    return handleApiError(error, "Failed to update membership product");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const existingTransactions = await prisma.transaction.findFirst({
      where: { productId: id },
    });

    if (existingTransactions) {
      return NextResponse.json(
        {
          error: "Cannot delete product with existing transactions. Please deactivate the product instead.",
        },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: { imageAsset: true },
    });

    await prisma.product.delete({
      where: { id },
    });

    const imageAsset = parseCloudinaryAsset(product?.imageAsset);
    if (imageAsset) {
      deleteCloudinaryAsset({ publicId: imageAsset.publicId }).catch((error: unknown) => {
        console.warn("Failed to delete Cloudinary product image on delete:", error);
      });
    }

    return NextResponse.json({ message: "Membership product deleted successfully" });
  } catch (error) {
    return handleApiError(error, "Failed to delete membership product");
  }
}
