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

import { CancelSessionDialogContent } from "./cancel-session-dialog-content";
import { Session } from "./schema";

interface CancelSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onConfirm: () => void;
  isCancelling?: boolean;
}

export function CancelSessionDialog({
  open,
  onOpenChange,
  session,
  onConfirm,
  isCancelling = false,
}: CancelSessionDialogProps) {
  if (!session) return null;

  const hasBookings = (session._count?.bookings || 0) > 0;

  return (
    <Dialog open={open} onOpenChange={isCancelling ? () => {} : onOpenChange}>
      <DialogContent className="max-w-md">
        {/* Loading Overlay */}
        {isCancelling && (
          <div className="bg-background/80 absolute inset-0 z-50 flex items-center justify-center rounded-lg backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="text-destructive h-8 w-8 animate-spin" />
              <div className="text-muted-foreground text-sm font-medium">Cancelling session...</div>
            </div>
          </div>
        )}

        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`bg-destructive/10 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${isCancelling ? "opacity-50" : "opacity-100"}`}
            >
              <AlertTriangle className="text-destructive h-5 w-5" />
            </div>
            <div className={`transition-all duration-300 ${isCancelling ? "opacity-50" : "opacity-100"}`}>
              <DialogTitle>Cancel Session</DialogTitle>
              <DialogDescription className="mt-1">Are you sure you want to cancel this session?</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <CancelSessionDialogContent session={session} hasBookings={hasBookings} isCancelling={isCancelling} />

        <DialogFooter className={`transition-all duration-300 ${isCancelling ? "opacity-50" : "opacity-100"}`}>
          <Button variant="outline" disabled={isCancelling} onClick={() => onOpenChange(false)}>
            Keep Session
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isCancelling}
            className="bg-destructive hover:bg-destructive/90 focus:ring-destructive relative overflow-hidden text-white hover:text-white"
          >
            {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCancelling ? "Cancelling..." : "Cancel Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
