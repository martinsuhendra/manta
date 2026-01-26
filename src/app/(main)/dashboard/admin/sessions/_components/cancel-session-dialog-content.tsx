"use client";

import { AlertTriangle } from "lucide-react";

import { Session } from "./schema";

interface CancelSessionDialogContentProps {
  session: Session;
  hasBookings: boolean;
  isCancelling: boolean;
}

export function CancelSessionDialogContent({ session, hasBookings, isCancelling }: CancelSessionDialogContentProps) {
  const bookingCount = session._count?.bookings || 0;

  return (
    <div className={`space-y-4 transition-all duration-300 ${isCancelling ? "opacity-50" : "opacity-100"}`}>
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
              {bookingCount} participant{bookingCount !== 1 ? "s" : ""} enrolled
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
              <div className="text-destructive font-medium">Participants will be notified</div>
              <div className="text-muted-foreground mt-1">
                All {bookingCount} participant{bookingCount !== 1 ? "s" : ""} will receive an email notification about
                this cancellation.
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasBookings && (
        <div className="text-muted-foreground text-sm">
          This session has no participants. You can cancel it without affecting anyone.
        </div>
      )}
    </div>
  );
}
