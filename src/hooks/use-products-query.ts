"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Product } from "@/app/(main)/dashboard/products/_components/schema";

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
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
