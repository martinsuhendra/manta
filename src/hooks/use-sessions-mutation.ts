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
    onMutate: async ({ sessionId, data }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["sessions"] });

      // Get all existing sessions queries to update them
      const previousQueriesData = queryClient.getQueriesData({ queryKey: ["sessions"] });

      // Update all sessions queries optimistically
      queryClient.setQueriesData({ queryKey: ["sessions"] }, (old: any) => {
        if (!old) return old;

        return old.map((session: any) => (session.id === sessionId ? { ...session, ...data } : session));
      });

      // Return a context object with the snapshotted values
      return { previousQueriesData };
    },
    onSuccess: () => {
      toast.success("Session updated successfully");
    },
    onError: (error: any, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
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
