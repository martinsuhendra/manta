"use client";

import { QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
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

interface Session {
  id: string;
  _count?: {
    bookings?: number;
  };
  [key: string]: unknown;
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
      const previousQueriesData = queryClient.getQueriesData<Session[]>({ queryKey: ["sessions"] });

      // Optimistically update session booking count
      queryClient.setQueriesData<Session[]>({ queryKey: ["sessions"] }, (old) => {
        if (!old) return old;

        return old.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                _count: {
                  ...session._count,
                  bookings: (session._count?.bookings ?? 0) + 1,
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
    onError: (error, variables, context) => {
      // Roll back on error
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData<Session[]>(queryKey, data);
        });
      }

      const message =
        error instanceof Error && "response" in error
          ? ((error as { response?: { data?: { error?: string } } }).response?.data?.error ??
            "Failed to add participant")
          : "Failed to add participant";
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
      const previousQueriesData = queryClient.getQueriesData<Session[]>({ queryKey: ["sessions"] });

      // Optimistically update session booking count
      queryClient.setQueriesData<Session[]>({ queryKey: ["sessions"] }, (old) => {
        if (!old) return old;

        return old.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                _count: {
                  ...session._count,
                  bookings: Math.max((session._count?.bookings ?? 0) - 1, 0),
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
    onError: (error, variables, context) => {
      // Roll back on error
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData<Session[]>(queryKey, data);
        });
      }

      const message =
        error instanceof Error && "response" in error
          ? ((error as { response?: { data?: { error?: string } } }).response?.data?.error ??
            "Failed to remove participant")
          : "Failed to remove participant";
      toast.error(message);
      throw error;
    },
  });
}
