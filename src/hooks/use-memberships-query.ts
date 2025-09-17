"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Membership {
  id: string;
  licenseCode: string;
  status: string;
  useCount: number;
  remainingQuota: number;
  joinDate: string;
  expiredAt: string;
  transactionId?: string;
  customerName?: string;
  customerEmail?: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    validDays: number;
    quota: number;
    isActive: boolean;
    features: string[];
  };
  user: {
    id: string;
    name?: string;
    email?: string;
  };
}

export function useMemberships(userId?: string) {
  return useQuery<Membership[]>({
    queryKey: ["memberships", userId],
    queryFn: async () => {
      const params = userId ? { userId } : {};
      const response = await axios.get("/api/memberships", { params });
      return response.data;
    },
  });
}
