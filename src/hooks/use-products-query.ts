"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Product } from "@/app/(main)/dashboard/products/_components/schema";
import { useBrandStore } from "@/stores/brand/brand-provider";

export function useProducts() {
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  return useQuery<Product[]>({
    queryKey: ["products", activeBrandId],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/products");
        return response.data;
      } catch (error) {
        console.error("Products API error:", error);
        throw error;
      }
    },
    retry: false, // Don't retry on auth errors
  });
}
