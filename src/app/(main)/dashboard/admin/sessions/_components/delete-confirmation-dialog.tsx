"use client";

import * as React from "react";

import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Session } from "./schema";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  session,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmationDialogProps) {
  if (!session) return null;

  const hasBookings = (session._count?.bookings || 0) > 0;

  return (
    <Dialog open={open} onOpenChange={isDeleting ? () => {} : onOpenChange}>
      <DialogContent className="max-w-md">
        {/* Loading Overlay */}
        {isDeleting && (
          <div className="bg-background/80 absolute inset-0 z-50 flex items-center justify-center rounded-lg backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="text-destructive h-8 w-8 animate-spin" />
              <div className="text-muted-foreground text-sm font-medium">Deleting session...</div>
            </div>
          </div>
        )}

        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`bg-destructive/10 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${isDeleting ? "opacity-50" : "opacity-100"}`}
            >
              <AlertTriangle className="text-destructive h-5 w-5" />
            </div>
            <div className={`transition-all duration-300 ${isDeleting ? "opacity-50" : "opacity-100"}`}>
              <DialogTitle>Delete Session</DialogTitle>
              <DialogDescription className="mt-1">Are you sure you want to delete this session?</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className={`space-y-4 transition-all duration-300 ${isDeleting ? "opacity-50" : "opacity-100"}`}>
          {/* Session Details */}
          <div className="bg-muted/50 rounded-lg border p-3">
            <div className="space-y-2 text-sm">
              <div className="font-medium">{session.item.name}</div>
              <div className="text-muted-foreground">
                {new Date(session.date).toLocaleDateString()} • {session.startTime} - {session.endTime}
              </div>
              {session.teacher && (
                <div className="text-muted-foreground">Teacher: {session.teacher.name || session.teacher.email}</div>
              )}
              {hasBookings && (
                <div className="text-muted-foreground">
                  {session._count?.bookings} participant{(session._count?.bookings || 0) !== 1 ? "s" : ""} enrolled
                </div>
              )}
            </div>
          </div>

          {/* Warning for sessions with bookings */}
          {hasBookings && (
            <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-3">
              <div className="flex gap-2">
                <AlertTriangle className="text-destructive mt-0.5 h-4 w-4 flex-shrink-0" />
                <div className="text-sm">
                  <div className="text-destructive font-medium">Cannot delete session</div>
                  <div className="text-muted-foreground mt-1">
                    This session has participants enrolled. Please cancel or move the participants before deleting.
                  </div>
                </div>
              </div>
            </div>
          )}

          {!hasBookings && (
            <div className="text-muted-foreground text-sm">
              This action cannot be undone. The session will be permanently removed from your schedule.
            </div>
          )}
        </div>

        <DialogFooter className={`transition-all duration-300 ${isDeleting ? "opacity-50" : "opacity-100"}`}>
          <Button variant="outline" disabled={isDeleting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={hasBookings || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive relative overflow-hidden"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? "Deleting..." : "Delete Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
