"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: "ADMIN" | "SUPERADMIN" | "MEMBER" | "TEACHER";
  phoneNo: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    memberships: number;
  };
}

// Re-export from mutations for backward compatibility
export { useCreateUser, useUpdateUser, useDeleteUser } from "./use-users-mutation";

export function useTeachers() {
  return useQuery<User[]>({
    queryKey: ["users", "teachers"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/users", {
          params: { role: "TEACHER" },
        });
        return response.data;
      } catch (error) {
        console.error("Teachers API error:", error);
        throw error;
      }
    },
    retry: false,
  });
}

export function useUsers(params?: { role?: string }) {
  return useQuery<User[]>({
    queryKey: ["users", params],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/users", { params });
        return response.data;
      } catch (error) {
        console.error("Users API error:", error);
        throw error;
      }
    },
    retry: false,
  });
}
