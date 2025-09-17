"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Product } from "@/app/(main)/dashboard/products/_components/schema";

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await axios.get("/api/products");
      return response.data;
    },
  });
}
