"use client";

import { useQuery } from "@tanstack/react-query";

import { Membership } from "@/app/(main)/dashboard/admin/memberships/_components/schema";

export function useAdminMemberships() {
  return useQuery<Membership[]>({
    queryKey: ["admin-memberships"],
    queryFn: async () => {
      const response = await fetch("/api/admin/memberships");
      if (!response.ok) {
        throw new Error("Failed to fetch memberships");
      }
      return response.json();
    },
  });
}
