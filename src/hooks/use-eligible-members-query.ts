"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { EligibleMember } from "@/app/(main)/dashboard/admin/sessions/_components/schema";

export function useEligibleMembersQuery(sessionId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["eligible-members", sessionId],
    queryFn: async () => {
      const response = await axios.get<EligibleMember[]>(`/api/admin/sessions/${sessionId}/bookings`);
      return response.data;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
