"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Item } from "@/app/(main)/dashboard/admin/items/_components/schema";
import { useBrandStore } from "@/stores/brand/brand-provider";

export function useItems(params?: { includeSchedules?: boolean; includeTeachers?: boolean }) {
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const incSched = params?.includeSchedules ?? false;
  const incTeachers = params?.includeTeachers ?? false;

  return useQuery<Item[]>({
    // Matches invalidateQueries({ queryKey: ["admin-items"] }) — X-Brand-Id is set by axios when a specific store is selected
    queryKey: ["admin-items", activeBrandId, incSched, incTeachers],
    queryFn: async () => {
      try {
        const searchParams = new URLSearchParams();
        if (incSched) searchParams.set("includeSchedules", "true");
        if (incTeachers) searchParams.set("includeTeachers", "true");
        const url = `/api/admin/items${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
        const response = await axios.get<Item[]>(url);
        return response.data;
      } catch (error) {
        console.error("Items API error:", error);
        throw error;
      }
    },
    retry: false,
  });
}

export function useItemTeachers(itemId: string, enabled = true) {
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  return useQuery({
    queryKey: ["admin-items", itemId, "teachers", activeBrandId],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/admin/items/${itemId}/teachers`);
        return response.data;
      } catch (error) {
        console.error("Item teachers API error:", error);
        throw error;
      }
    },
    enabled: enabled && !!itemId,
    retry: false,
  });
}
