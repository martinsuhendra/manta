"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

interface PurchaseMembershipData {
  productId: string;
  transactionId?: string;
  customerName?: string;
  customerEmail?: string;
}

export function usePurchaseMembership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PurchaseMembershipData) => {
      const response = await axios.post("/api/memberships", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Membership purchased successfully!");
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data.error || "Failed to purchase membership");
    },
  });
}
