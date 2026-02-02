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
    <section id="plans" className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Membership Plans</h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Choose the plan that fits your goals. No hidden fees, just results.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-muted-foreground mt-16 text-center">
            <p className="text-lg">No membership plans available at the moment.</p>
            <p className="mt-2 text-sm">Please check back later.</p>
          </div>
        ) : (
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {products.map((product) => (
              <PublicProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
