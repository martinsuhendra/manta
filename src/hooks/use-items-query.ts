"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Item } from "@/app/(main)/dashboard/admin/items/_components/schema";

export function useItems() {
  return useQuery<Item[]>({
    queryKey: ["items"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/admin/items");
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
