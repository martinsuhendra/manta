/* eslint-disable @typescript-eslint/no-explicit-any */
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
      return { sessionId, updatedSession: response.data };
    },
    onSuccess: ({ sessionId, updatedSession }) => {
      // Update all sessions list queries with the updated session data
      queryClient.setQueriesData({ queryKey: ["sessions"] }, (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((session: any) => (session.id === sessionId ? updatedSession : session));
      });

      // Update the individual session query if it exists
      queryClient.setQueryData({ queryKey: ["sessions", sessionId] }, updatedSession);

      // Invalidate all sessions queries to ensure fresh data from server
      // This ensures any computed fields or related data are also updated
      queryClient.invalidateQueries({
        queryKey: ["sessions"],
        exact: false, // Invalidate all queries that start with ["sessions"]
      });

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
