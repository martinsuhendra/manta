"use client";

import Link from "next/link";

import { Package, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptyProductsState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div className="bg-muted mx-auto flex h-16 w-16 items-center justify-center rounded-full">
        <Package className="text-muted-foreground h-8 w-8" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No Products Created</h3>
      <p className="text-muted-foreground mt-2 mb-4 text-sm">
        You need to create at least one product before you can assign memberships to users.
      </p>
      <Button asChild>
        <Link href="/dashboard/products">
          <Plus className="mr-2 h-4 w-4" />
          Create First Product
        </Link>
      </Button>
    </div>
  );
}
