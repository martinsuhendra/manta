"use client";

import { PublicProductCard } from "./public-product-card";

interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  validDays: number;
  image: string | null;
  paymentUrl: string | null;
  whatIsIncluded: string | null;
  features: string[];
  createdAt: string;
}

interface MembershipPlansProps {
  products: PublicProduct[];
}

export function MembershipPlans({ products }: MembershipPlansProps) {
  return (
    <section id="plans" className="border-border bg-muted/30 border-t py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground text-3xl font-black tracking-tighter uppercase italic sm:text-4xl md:text-5xl">
            Join The Ranks
          </h2>
          <p className="text-muted-foreground mt-4">No contracts, no hidden fees. Just pure effort and results.</p>
        </div>

        {products.length === 0 ? (
          <div className="text-muted-foreground mt-16 text-center">
            <p className="text-lg">No membership plans available at the moment.</p>
            <p className="mt-2 text-sm">Please check back later.</p>
          </div>
        ) : (
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <div
                key={product.id}
                className={index === 1 && products.length >= 3 ? "relative lg:z-10 lg:scale-105" : undefined}
              >
                <PublicProductCard product={product} highlight={index === 1 && products.length >= 3} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
