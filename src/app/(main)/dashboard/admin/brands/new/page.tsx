"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { useCreateBrand } from "@/hooks/use-brand-mutation";
import { USER_ROLES } from "@/lib/types";

import { BrandForm, type BrandFormValues } from "../_components/brand-form";

export default function NewBrandPage() {
  const router = useRouter();
  const createBrand = useCreateBrand();

  function handleSubmit(values: BrandFormValues) {
    createBrand.mutate(values, {
      onSuccess: (brand) => router.push(`/dashboard/admin/brands/${brand.id}`),
    });
  }

  return (
    <RoleGuard allowedRoles={[USER_ROLES.DEVELOPER]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/admin/brands">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New brand</h1>
            <p className="text-muted-foreground">Add a new branch or brand.</p>
          </div>
        </div>
        <BrandForm onSubmit={handleSubmit} isPending={createBrand.isPending} submitLabel="Create brand" />
      </div>
    </RoleGuard>
  );
}
