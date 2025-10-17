"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

interface AddParticipantData {
  sessionId: string;
  userId: string;
  membershipId: string;
}

interface RemoveParticipantData {
  sessionId: string;
  bookingId: string;
}

export function useAddSessionParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, userId, membershipId }: AddParticipantData) => {
      const response = await axios.post(`/api/admin/sessions/${sessionId}/bookings`, {
        userId,
        membershipId,
      });
      return response.data;
    },
    onMutate: async ({ sessionId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["sessions"] });

      // Get all existing sessions queries
      const previousQueriesData = queryClient.getQueriesData({ queryKey: ["sessions"] });

      // Optimistically update session booking count
      queryClient.setQueriesData({ queryKey: ["sessions"] }, (old: unknown) => {
        if (!old || !Array.isArray(old)) return old;

        return old.map((session: Record<string, unknown>) =>
          session.id === sessionId
            ? {
                ...session,
                _count: {
                  ...(session._count as Record<string, unknown>),
                  bookings: ((session._count as { bookings?: number })?.bookings || 0) + 1,
                },
              }
            : session,
        );
      });

      return { previousQueriesData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Participant added successfully");
    },
    onError: (error: unknown, variables, context) => {
      // Roll back on error
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]: [unknown, unknown]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to add participant";
      toast.error(message);
      throw error;
    },
  });
}

export function useRemoveSessionParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, bookingId }: RemoveParticipantData) => {
      const response = await axios.delete(`/api/admin/sessions/${sessionId}/bookings/${bookingId}`);
      return response.data;
    },
    onMutate: async ({ sessionId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["sessions"] });

      // Get all existing sessions queries
      const previousQueriesData = queryClient.getQueriesData({ queryKey: ["sessions"] });

      // Optimistically update session booking count
      queryClient.setQueriesData({ queryKey: ["sessions"] }, (old: unknown) => {
        if (!old || !Array.isArray(old)) return old;

        return old.map((session: Record<string, unknown>) =>
          session.id === sessionId
            ? {
                ...session,
                _count: {
                  ...(session._count as Record<string, unknown>),
                  bookings: Math.max(((session._count as { bookings?: number })?.bookings || 0) - 1, 0),
                },
              }
            : session,
        );
      });

      return { previousQueriesData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Participant removed successfully");
    },
    onError: (error: unknown, variables, context) => {
      // Roll back on error
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]: [unknown, unknown]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to remove participant";
      toast.error(message);
      throw error;
    },
  });
}
