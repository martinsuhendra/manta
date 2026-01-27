/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

interface CreateUserData {
  name: string;
  email: string;
  role: string;
  phoneNo?: string;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
  phoneNo?: string;
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await axios.post("/api/users", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to create user";
      toast.error(message);
      throw error;
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserData }) => {
      const response = await axios.patch(`/api/users/${userId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to update user";
      toast.error(message);
      throw error;
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await axios.delete(`/api/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to delete user";
      toast.error(message);
      throw error;
    },
  });
}
