"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Item } from "@/app/(main)/dashboard/admin/items/_components/schema";

export function useItems(params?: { includeSchedules?: boolean; includeTeachers?: boolean }) {
  return useQuery<Item[]>({
    queryKey: ["items", params],
    queryFn: async () => {
      try {
        const searchParams = new URLSearchParams();
        if (params?.includeSchedules) searchParams.set("includeSchedules", "true");
        if (params?.includeTeachers) searchParams.set("includeTeachers", "true");
        const url = `/api/admin/items${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
        const response = await axios.get(url);
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
  return useQuery({
    queryKey: ["items", itemId, "teachers"],
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
