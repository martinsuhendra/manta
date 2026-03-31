"use client";

import Link from "next/link";

import { Plus } from "lucide-react";

import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { useBrandsAdmin } from "@/hooks/use-brands-query";
import { USER_ROLES } from "@/lib/types";

import { BrandsTable } from "./_components/brands-table";

export default function AdminBrandsPage() {
  const { data: brands = [], isLoading } = useBrandsAdmin();

  return (
    <RoleGuard allowedRoles={[USER_ROLES.DEVELOPER]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
            <p className="text-muted-foreground">
              Manage branches and brands. Configure name, address, and theme colors per brand.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/admin/brands/new">
              <Plus className="mr-2 h-4 w-4" />
              Add brand
            </Link>
          </Button>
        </div>
        <BrandsTable data={brands} isLoading={isLoading} />
      </div>
    </RoleGuard>
  );
}
