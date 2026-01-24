import { Metadata } from "next";

import { auth } from "@/auth";
import { APP_CONFIG } from "@/config/app-config";
import { prisma } from "@/lib/generated/prisma";

import { PublicProductCard } from "./_components/public-product-card";
import { ShopHeader } from "./_components/shop-header";

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Membership Plans`,
  description: "Browse our membership plans and join our community today.",
};

async function getActiveProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
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
      },
    });
    // Convert Decimal to number and Date to string for client components
    return products.map((product) => ({
      ...product,
      price: Number(product.price),
      createdAt: product.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export default async function ShopPage() {
  const products = await getActiveProducts();
  const session = await auth();

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <ShopHeader session={session} />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Welcome to {APP_CONFIG.name}</h2>
          <p className="text-muted-foreground mt-6 text-lg">
            Join our community and unlock exclusive benefits with our flexible membership plans.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="container mx-auto px-4 pb-16">
        {products.length === 0 ? (
          <div className="text-muted-foreground py-16 text-center">
            <p className="text-lg">No membership plans available at the moment.</p>
            <p className="mt-2 text-sm">Please check back later.</p>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h3 className="text-2xl font-bold">Choose Your Plan</h3>
              <p className="text-muted-foreground mt-2">Select the membership that best fits your needs</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <PublicProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="text-muted-foreground text-center text-sm">
            <p>{APP_CONFIG.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
