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
