"use client";

import { useQuery } from "@tanstack/react-query";

export interface FreezeRequestWithRelations extends Record<string, unknown> {
  id: string;
  membershipId: string;
  reason: string;
  reasonDetails: string | null;
  status: string;
  requestedById: string;
  approvedById: string | null;
  rejectionReason: string | null;
  freezeStartDate: string | null;
  freezeEndDate: string | null;
  totalFrozenDays: number | null;
  createdAt: string;
  updatedAt: string;
  membership: {
    id: string;
    status: string;
    expiredAt: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      phoneNo: string | null;
    };
    product: {
      id: string;
      name: string;
      validDays: number;
    };
  };
  requestedBy: {
    id: string;
    name: string | null;
    email: string | null;
  };
  approvedBy: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

export function useAdminFreezeRequests(statusFilter?: string, membershipId?: string) {
  return useQuery<FreezeRequestWithRelations[]>({
    queryKey: ["admin-freeze-requests", statusFilter ?? "all", membershipId ?? ""],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (membershipId) params.set("membershipId", membershipId);
      const url = params.toString() ? `/api/admin/freeze-requests?${params}` : "/api/admin/freeze-requests";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch freeze requests");
      }
      return response.json();
    },
  });
}
