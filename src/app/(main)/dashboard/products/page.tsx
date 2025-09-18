"use client";

import { RoleGuard } from "@/components/role-guard";
import { useProducts } from "@/hooks/use-products-query";
import { USER_ROLES } from "@/lib/types";

import { ProductsTable } from "./_components/products-table";

export default function Page() {
  const { data: products, isLoading, error } = useProducts();

  if (error) throw new Error(error.message);

  return (
    <RoleGuard allowedRoles={[USER_ROLES.SUPERADMIN]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <ProductsTable data={products || []} isLoading={isLoading} />
      </div>
    </RoleGuard>
  );
}
