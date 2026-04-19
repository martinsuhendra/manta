"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ManualTransactionFormValues } from "@/app/(main)/dashboard/finance/transactions/_components/schema";

export function useCreateAdminTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ManualTransactionFormValues) => {
      const response = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Failed to create transaction");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
    },
  });
}
