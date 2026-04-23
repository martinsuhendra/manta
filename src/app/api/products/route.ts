import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { getProductWhereForBrandAccess, handleApiError, requireBrandAccess, requireSuperAdmin } from "@/lib/api-utils";
import { parseCloudinaryAsset, resolveAssetUrl } from "@/lib/cloudinary-asset";
import { prisma } from "@/lib/generated/prisma";

const createProductSchema = z
  .object({
    brandIds: z.array(z.string().uuid("Invalid brand ID")).min(1, "Select at least one brand"),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    price: z.number().min(0, "Price must be at least 0"),
    validDays: z.number().positive("Valid days must be positive"),
    isPurchaseUnlimited: z.boolean().optional().default(true),
    purchaseLimitPerUser: z.number().int().min(1, "Purchase limit must be at least 1").nullable().optional(),
    features: z.array(z.string()).optional().default([]),
    image: z.string().optional(),
    imageAsset: z.unknown().nullable().optional(),
    paymentUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
    whatIsIncluded: z.string().optional(),
    participantsPerPurchase: z.number().int().min(1).max(10).optional().default(1),
    isActive: z.boolean().optional().default(true),
    isPublic: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.isPurchaseUnlimited) return;
    if (typeof data.purchaseLimitPerUser === "number" && data.purchaseLimitPerUser >= 1) return;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Purchase limit per user is required when unlimited is disabled",
      path: ["purchaseLimitPerUser"],
    });
  });

export async function GET(request: NextRequest) {
  try {
    const { error, brandIds } = await requireBrandAccess(request);
    if (error) return error;

    const whereBrand = getProductWhereForBrandAccess(request, brandIds);

    const products = await prisma.product.findMany({
      where: whereBrand,
      orderBy: { position: "asc" },
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

    return NextResponse.json(
      products.map((product) => ({
        ...product,
        brandIds: product.productBrands.map((pb) => pb.brandId),
        brands: product.productBrands.map((pb) => pb.brand),
        imageAsset: parseCloudinaryAsset(product.imageAsset),
        image: resolveAssetUrl(product.imageAsset, product.image),
      })),
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch membership products");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireSuperAdmin();
    if (error) return error;

    const body = await request.json();
    const validatedData = createProductSchema.parse(body);
    const { brandIds, ...productData } = validatedData;

    const brands = await prisma.brand.findMany({
      where: { id: { in: brandIds }, isActive: true },
      select: { id: true },
    });
    if (brands.length !== brandIds.length) {
      return NextResponse.json({ error: "One or more selected brands are invalid or inactive" }, { status: 400 });
    }

    const imageAsset = parseCloudinaryAsset(validatedData.imageAsset);
    const product = await prisma.product.create({
      data: {
        ...productData,
        imageAsset: imageAsset ?? Prisma.JsonNull,
        image: resolveAssetUrl(imageAsset, validatedData.image),
        productBrands: {
          create: brandIds.map((brandId) => ({ brandId })),
        },
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

    return NextResponse.json(
      {
        ...product,
        brandIds: product.productBrands.map((pb) => pb.brandId),
        brands: product.productBrands.map((pb) => pb.brand),
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Failed to create membership product");
  }
}
