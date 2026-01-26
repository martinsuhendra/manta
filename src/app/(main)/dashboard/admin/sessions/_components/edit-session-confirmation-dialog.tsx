"use client";

import * as React from "react";

import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditSessionConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isUpdating?: boolean;
  participantCount?: number;
}

export function EditSessionConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  isUpdating = false,
  participantCount = 0,
}: EditSessionConfirmationDialogProps) {
  const hasParticipants = participantCount > 0;

  return (
    <Dialog open={open} onOpenChange={isUpdating ? () => {} : onOpenChange}>
      <DialogContent className="max-w-md">
        {/* Loading Overlay */}
        {isUpdating && (
          <div className="bg-background/80 absolute inset-0 z-50 flex items-center justify-center rounded-lg backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <div className="text-muted-foreground text-sm font-medium">Updating session...</div>
            </div>
          </div>
        )}

        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${isUpdating ? "opacity-50" : "opacity-100"}`}
            >
              <AlertCircle className="text-primary h-5 w-5" />
            </div>
            <div className={`transition-all duration-300 ${isUpdating ? "opacity-50" : "opacity-100"}`}>
              <DialogTitle>Update Session</DialogTitle>
              <DialogDescription className="mt-1">Are you sure you want to update this session?</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className={`space-y-4 transition-all duration-300 ${isUpdating ? "opacity-50" : "opacity-100"}`}>
          {hasParticipants && (
            <div className="border-primary/20 bg-primary/5 rounded-lg border p-3">
              <div className="flex gap-2">
                <AlertCircle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                <div className="text-sm">
                  <div className="text-primary font-medium">Participants will be notified</div>
                  <div className="text-muted-foreground mt-1">
                    All {participantCount} participant{participantCount !== 1 ? "s" : ""} will receive an email
                    notification about the session update.
                  </div>
                </div>
              </div>
            </div>
          )}

          {!hasParticipants && (
            <div className="text-muted-foreground text-sm">
              This session has no participants. You can update it without affecting anyone.
            </div>
          )}
        </div>

        <DialogFooter className={`transition-all duration-300 ${isUpdating ? "opacity-50" : "opacity-100"}`}>
          <Button variant="outline" disabled={isUpdating} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Session"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
