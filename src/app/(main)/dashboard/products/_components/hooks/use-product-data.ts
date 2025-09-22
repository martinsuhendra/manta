import { useQuery } from "@tanstack/react-query";

import { Item } from "../../../admin/items/_components/schema";

export function useProductData(productId?: string, isEdit?: boolean) {
  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["items"],
    queryFn: async () => {
      const response = await fetch("/api/admin/items");
      if (!response.ok) throw new Error("Failed to fetch items");
      return response.json();
    },
  });

  const { data: existingProductItems = [] } = useQuery({
    queryKey: ["product-items-with-usage", productId],
    queryFn: async () => {
      if (!productId) return [];
      const response = await fetch(`/api/admin/products/${productId}/items`);
      if (!response.ok) throw new Error("Failed to fetch product items");
      return response.json();
    },
    enabled: isEdit && !!productId,
  });

  const { data: existingQuotaPools = [] } = useQuery({
    queryKey: ["quota-pools", productId],
    queryFn: async () => {
      if (!productId) return [];
      const response = await fetch(`/api/admin/products/${productId}/quota-pools`);
      if (!response.ok) throw new Error("Failed to fetch quota pools");
      return response.json();
    },
    enabled: isEdit && !!productId,
  });

  return {
    items,
    existingProductItems,
    existingQuotaPools,
  };
}
