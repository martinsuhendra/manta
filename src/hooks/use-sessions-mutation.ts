"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

import { CreateSessionForm, UpdateSessionForm } from "@/app/(main)/dashboard/admin/sessions/_components/schema";

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSessionForm) => {
      const response = await axios.post("/api/admin/sessions", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session created successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to create session";
      toast.error(message);
      throw error;
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, data }: { sessionId: string; data: UpdateSessionForm }) => {
      const response = await axios.put(`/api/admin/sessions/${sessionId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session updated successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to update session";
      toast.error(message);
      throw error;
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await axios.delete(`/api/admin/sessions/${sessionId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session deleted successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to delete session";
      toast.error(message);
      throw error;
    },
  });
}
