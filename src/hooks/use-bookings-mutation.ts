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

interface ConfirmParticipantsData {
  sessionId: string;
  bookingIds: string[];
}

interface Session {
  id: string;
  _count?: {
    bookings?: number;
  };
  [key: string]: unknown;
}

function optimisticAdjustSessionBookingCount(old: unknown, sessionId: string, delta: 1 | -1): unknown {
  if (!old) return old;

  const nextCount = (current: number) => (delta === 1 ? current + 1 : Math.max(current - 1, 0));

  if (Array.isArray(old)) {
    return old.map((session) => {
      if (typeof session !== "object" || session === null || !("id" in session)) return session;
      if ((session as Session).id !== sessionId) return session;
      const s = session as Session;
      return {
        ...s,
        _count: {
          ...s._count,
          bookings: nextCount(s._count?.bookings ?? 0),
        },
      };
    });
  }

  if (typeof old === "object" && "id" in old && (old as Session).id === sessionId) {
    const s = old as Session;
    return {
      ...s,
      _count: {
        ...s._count,
        bookings: nextCount(s._count?.bookings ?? 0),
      },
    };
  }

  return old;
}

function bookingMutationErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as unknown;
    if (data && typeof data === "object" && "error" in data) {
      const err = (data as { error: unknown }).error;
      if (typeof err === "string" && err.length > 0) return err;
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
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
      queryClient.setQueriesData({ queryKey: ["sessions"] }, (old) =>
        optimisticAdjustSessionBookingCount(old, sessionId, 1),
      );

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
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error(bookingMutationErrorMessage(error, "Failed to add participant"));
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
      queryClient.setQueriesData({ queryKey: ["sessions"] }, (old) =>
        optimisticAdjustSessionBookingCount(old, sessionId, -1),
      );

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
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error(bookingMutationErrorMessage(error, "Failed to remove participant"));
    },
  });
}

interface ConfirmParticipantsResponse {
  updatedCount: number;
  skippedCount: number;
}

export function useConfirmSessionParticipants() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, bookingIds }: ConfirmParticipantsData): Promise<ConfirmParticipantsResponse> => {
      const response = await axios.patch(`/api/admin/sessions/${sessionId}/bookings`, {
        bookingIds,
        targetStatus: "CHECKED_IN",
      });
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      if (result.skippedCount > 0) {
        toast.success(`Checked in ${result.updatedCount} participant(s). Skipped ${result.skippedCount}.`);
        return;
      }
      toast.success(`Checked in ${result.updatedCount} participant(s).`);
    },
    onError: (error) => {
      toast.error(bookingMutationErrorMessage(error, "Failed to check in participants"));
    },
  });
}
