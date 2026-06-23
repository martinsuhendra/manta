import { NextResponse } from "next/server";

import { resolveActiveBrandIdFromCookie } from "@/lib/brand-cookie";
import { prisma } from "@/lib/generated/prisma";
import { createPublicCache, publicCacheHeaders } from "@/lib/http-cache";

const getCachedPublicProducts = createPublicCache(["public-products"], async (brandId: string | null) => {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isPublic: true,
      ...(brandId ? { productBrands: { some: { brandId } } } : {}),
    },
    orderBy: { position: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      validDays: true,
      image: true,
      paymentUrl: true,
      whatIsIncluded: true,
      features: true,
      createdAt: true,
      productBrands: {
        select: { brandId: true },
      },
    },
  });

  return products.map((product) => ({
    ...product,
    brandIds: product.productBrands.map((pb) => pb.brandId),
  }));
});

export async function GET() {
  try {
    const activeBrandId = await resolveActiveBrandIdFromCookie();
    const products = await getCachedPublicProducts(activeBrandId);

    return NextResponse.json(products, { headers: publicCacheHeaders() });
  } catch (error) {
    console.error("Failed to fetch public products:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch products",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
