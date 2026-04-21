"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  ManualTransactionFormValues,
  TransactionListItem,
} from "@/app/(main)/dashboard/finance/transactions/_components/schema";

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

interface UpdateAdminTransactionPayload {
  id: string;
  data: {
    amount?: number;
    status?: string;
    paymentMethod?: string | null;
    paymentProvider?: string | null;
    paidAt?: string | null;
    notes?: string | null;
  };
}

export function useUpdateAdminTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateAdminTransactionPayload) => {
      const response = await fetch(`/api/admin/transactions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Failed to update transaction");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-transaction-detail"] });
    },
  });
}

export function useDeleteAdminTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/transactions/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Failed to delete transaction");
      return result;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-transaction-detail", id] });
      queryClient.setQueryData<TransactionListItem[]>(["admin-transactions"], (previous) =>
        previous ? previous.filter((transaction) => transaction.id !== id) : previous,
      );
    },
  });
}
