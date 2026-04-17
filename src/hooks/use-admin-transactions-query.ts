"use client";

import { useQuery } from "@tanstack/react-query";

import type {
  TransactionDetail,
  TransactionListItem,
} from "@/app/(main)/dashboard/finance/transactions/_components/schema";

export interface AdminTransactionsFilters {
  status: string;
  paymentMethod: string;
  startDate: string;
  endDate: string;
}

interface UseAdminTransactionsParams {
  filters: AdminTransactionsFilters;
}

export function useAdminTransactions({ filters }: UseAdminTransactionsParams) {
  return useQuery<TransactionListItem[]>({
    queryKey: ["admin-transactions", filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (filters.status && filters.status !== "ALL") searchParams.set("status", filters.status);
      if (filters.paymentMethod && filters.paymentMethod !== "ALL") {
        searchParams.set("paymentMethod", filters.paymentMethod);
      }
      if (filters.startDate) searchParams.set("startDate", filters.startDate);
      if (filters.endDate) searchParams.set("endDate", filters.endDate);

      const response = await fetch(`/api/admin/transactions?${searchParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
}

export function useAdminTransactionDetail(transactionId: string | null, enabled: boolean) {
  return useQuery<TransactionDetail>({
    queryKey: ["admin-transaction-detail", transactionId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/transactions/${transactionId}`);
      if (!response.ok) throw new Error("Failed to fetch transaction detail");
      return response.json();
    },
    enabled: enabled && !!transactionId,
  });
}
