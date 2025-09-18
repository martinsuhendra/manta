"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  validDays: number;
  quota: number;
  isActive: boolean;
}

type UpdateProductData = Partial<CreateProductData>;

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductData) => {
      const response = await axios.post("/api/products", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Product created successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create product");
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductData }) => {
      const response = await axios.put(`/api/products/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Product updated successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update product");
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete product");
    },
  });
}

export function useReorderProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: string[]) => {
      const response = await axios.patch("/api/products/reorder", { productIds });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to reorder products");
    },
  });
}
