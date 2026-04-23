"use client";

import * as React from "react";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BulkDeleteSessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionIds: string[];
  onSuccess?: () => void;
}

export function BulkDeleteSessionsDialog({ open, onOpenChange, sessionIds, onSuccess }: BulkDeleteSessionsDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleConfirmDelete() {
    if (sessionIds.length === 0) {
      toast.error("No sessions selected");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/sessions/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionIds }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to delete selected sessions");
      }

      const data = (await response.json()) as {
        deletedSessions: number;
        deletedBookings: number;
        refundedBookings: number;
      };

      toast.success(
        `Deleted ${data.deletedSessions} session(s), removed ${data.deletedBookings} booking(s), refunded ${data.refundedBookings} quota-consuming booking(s).`,
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete selected sessions");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? () => {} : onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-destructive/10 flex h-10 w-10 items-center justify-center rounded-full">
              <AlertTriangle className="text-destructive h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Delete Selected Sessions</DialogTitle>
              <DialogDescription className="mt-1">
                Delete {sessionIds.length} selected session{sessionIds.length !== 1 ? "s" : ""}. Participant quota will
                be refunded automatically unless membership is unlimited.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-3 text-sm">
          <div className="text-destructive font-medium">This action cannot be undone.</div>
          <div className="text-muted-foreground mt-1">All bookings under the selected sessions will be removed.</div>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isSubmitting || sessionIds.length === 0}
            onClick={handleConfirmDelete}
            className="text-white hover:text-white"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            {isSubmitting ? "Deleting..." : "Delete Sessions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
