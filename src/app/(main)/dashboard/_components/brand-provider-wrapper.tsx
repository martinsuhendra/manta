"use client";

import { BrandStoreProvider } from "@/stores/brand/brand-provider";

interface BrandProviderWrapperProps {
  children: React.ReactNode;
  initialActiveBrandId?: string | "ALL";
}

export function BrandProviderWrapper({ children, initialActiveBrandId }: BrandProviderWrapperProps) {
  return <BrandStoreProvider initialActiveBrandId={initialActiveBrandId ?? "ALL"}>{children}</BrandStoreProvider>;
}
