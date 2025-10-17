"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

interface AddParticipantData {
  sessionId: string;
  userId: string;
  membershipId: string;
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
      queryClient.setQueriesData({ queryKey: ["sessions"] }, (old: any) => {
        if (!old) return old;

        return old.map((session: any) =>
          session.id === sessionId
            ? {
                ...session,
                _count: {
                  ...session._count,
                  bookings: (session._count?.bookings || 0) + 1,
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
    onError: (error: any, variables, context) => {
      // Roll back on error
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      const message = error.response?.data?.error || "Failed to add participant";
      toast.error(message);
      throw error;
    },
  });
}
