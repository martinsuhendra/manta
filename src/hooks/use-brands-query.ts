"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import type { BrandSummary } from "@/stores/brand/brand-store";

export interface BrandAdmin {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  logo: string | null;
  logoAsset?: unknown;
  primaryColor: string;
  accentColor: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useBrandsAdmin() {
  return useQuery<BrandAdmin[]>({
    queryKey: ["brands", "admin"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/brands");
      return res.data;
    },
    retry: false,
  });
}

export function useAccessibleBrands() {
  return useQuery<BrandSummary[]>({
    queryKey: ["brands", "accessible"],
    queryFn: async () => {
      const res = await axios.get("/api/brands/accessible");
      return res.data;
    },
    retry: false,
  });
}
