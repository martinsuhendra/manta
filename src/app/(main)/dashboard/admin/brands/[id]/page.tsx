"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft } from "lucide-react";

import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { useUpdateBrand } from "@/hooks/use-brand-mutation";
import { USER_ROLES } from "@/lib/types";

import { BrandForm, type BrandFormValues } from "../_components/brand-form";

interface BrandResponse {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  logo: string | null;
  primaryColor: string;
  accentColor: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EditBrandPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: brand, isLoading } = useQuery({
    queryKey: ["brands", "admin", id],
    queryFn: async () => {
      const res = await axios.get<BrandResponse>(`/api/admin/brands/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const updateBrand = useUpdateBrand(id);

  function handleSubmit(values: BrandFormValues) {
    updateBrand.mutate(
      {
        name: values.name,
        slug: values.slug,
        address: values.address || null,
        logo: values.logo || null,
        primaryColor: values.primaryColor,
        accentColor: values.accentColor,
        isActive: values.isActive,
      },
      {
        onSuccess: () => router.refresh(),
      },
    );
  }

  if (isLoading || !brand) {
    return (
      <RoleGuard allowedRoles={[USER_ROLES.DEVELOPER]}>
        <div className="@container/main flex flex-col gap-4">
          <div className="text-muted-foreground">Loading brand…</div>
        </div>
      </RoleGuard>
    );
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
            <h1 className="text-2xl font-bold tracking-tight">Edit brand</h1>
            <p className="text-muted-foreground">{brand.name}</p>
          </div>
        </div>
        <BrandForm
          defaultValues={{
            name: brand.name,
            slug: brand.slug,
            address: brand.address ?? "",
            logo: brand.logo ?? "",
            primaryColor: brand.primaryColor,
            accentColor: brand.accentColor,
            isActive: brand.isActive,
          }}
          onSubmit={handleSubmit}
          isPending={updateBrand.isPending}
        />
      </div>
    </RoleGuard>
  );
}
