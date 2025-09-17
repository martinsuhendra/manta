"use client";

import { useMemberships } from "@/hooks/use-memberships-query";
import { useProducts } from "@/hooks/use-products-query";

import { MembershipPurchase } from "./_components/membership-purchase";
import { MyMemberships } from "./_components/my-memberships";

export default function Page() {
  const { data: memberships = [], isLoading: membershipLoading } = useMemberships();
  const { data: products = [], isLoading: productsLoading } = useProducts();

  const availableProducts = products.filter((product) => product.isActive);

  return (
    <div className="@container/main flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Memberships</h2>
        <p className="text-muted-foreground">Manage your membership subscriptions and purchase new ones</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MembershipPurchase products={availableProducts} isLoading={productsLoading} />
        <MyMemberships memberships={memberships} isLoading={membershipLoading} />
      </div>
    </div>
  );
}
