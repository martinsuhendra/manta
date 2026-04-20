/* eslint-disable @typescript-eslint/no-unnecessary-condition */
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Session, SessionFilter } from "@/app/(main)/dashboard/admin/sessions/_components/schema";
import { useBrandStore } from "@/stores/brand/brand-provider";

export function useSessions(filters?: SessionFilter) {
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.append(key, value);
      }
    });
  }

  return useQuery<Session[]>({
    queryKey: ["sessions", filters, activeBrandId],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/admin/sessions", { params });
        return response.data;
      } catch (error) {
        console.error("Sessions API error:", error);
        throw error;
      }
    },
    retry: false,
  });
}

export function useSession(sessionId: string, enabled = true) {
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  return useQuery<Session>({
    queryKey: ["sessions", sessionId, activeBrandId],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/admin/sessions/${sessionId}`);
        return response.data;
      } catch (error) {
        console.error("Session API error:", error);
        throw error;
      }
    },
    enabled: enabled && !!sessionId,
    retry: false,
  });
}

interface PrivateSessionEligibilityMembership {
  id: string;
  productId: string;
  productName: string;
  expiredAt: string;
  slotsRequired: number;
  remainingQuota: number | null;
}

interface PrivateSessionEligibilityResponse {
  member: {
    id: string;
    name: string | null;
    email: string | null;
  };
  memberships: PrivateSessionEligibilityMembership[];
}

export function usePrivateSessionEligibility({
  userId,
  itemId,
  enabled = true,
}: {
  userId?: string;
  itemId?: string;
  enabled?: boolean;
}) {
  return useQuery<PrivateSessionEligibilityResponse>({
    queryKey: ["private-session-eligibility", userId, itemId],
    queryFn: async () => {
      const response = await axios.get("/api/admin/private-sessions", {
        params: {
          userId,
          itemId,
        },
      });
      return response.data;
    },
    enabled: enabled && !!userId && !!itemId,
    retry: false,
  });
}
