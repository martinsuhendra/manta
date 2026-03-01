/* eslint-disable react/no-array-index-key */
"use client";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, User, UserMinus, Users } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useRemoveSessionParticipant } from "@/hooks/use-bookings-mutation";
import { useSession } from "@/hooks/use-sessions-query";

import { Session } from "./schema";

type SessionBooking = NonNullable<Session["bookings"]>[number];

interface ParticipantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session;
}

/* eslint-disable complexity */
export function ParticipantsDialog({ open, onOpenChange, session }: ParticipantsDialogProps) {
  const queryClient = useQueryClient();
  const [bookingToRemove, setBookingToRemove] = useState<SessionBooking | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const { data: sessionDetail, isLoading } = useSession(session.id, open);
  const removeParticipantMutation = useRemoveSessionParticipant();

  const bookings = sessionDetail?.bookings ?? [];
  const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED");
  const waitlistedBookings = bookings.filter((b) => b.status === "WAITLISTED");
  const totalSlots = sessionDetail ? (sessionDetail.totalParticipantSlots ?? 0) : 0;

  const handleRemoveConfirm = () => {
    if (!bookingToRemove) return;
    setIsRemoving(true);

    removeParticipantMutation.mutate(
      { sessionId: session.id, bookingId: bookingToRemove.id },
      {
        onSuccess: () => {
          setBookingToRemove(null);
          queryClient.invalidateQueries({ queryKey: ["sessions"] });
        },
        onSettled: () => setIsRemoving(false),
      },
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Session Participants</DialogTitle>
            <DialogDescription>
              {session.item.name} • {session.startTime} - {session.endTime}
            </DialogDescription>
          </DialogHeader>

          <div className="border-muted bg-muted/30 flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Current Capacity</p>
                <p className="text-muted-foreground text-xs">
                  {totalSlots} of {session.item.capacity} spots filled
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold">
              {totalSlots} / {session.item.capacity}
            </p>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={`skeleton-${i}`} className="h-16 w-full" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No participants have been added to this session yet.</AlertDescription>
              </Alert>
            ) : (
              <>
                {confirmedBookings.length > 0 && (
                  <BookingSection
                    title={`Confirmed Participants (${confirmedBookings.length})`}
                    bookings={confirmedBookings}
                    variant="confirmed"
                    onRemove={setBookingToRemove}
                    isRemoving={isRemoving}
                  />
                )}
                {waitlistedBookings.length > 0 && (
                  <BookingSection
                    title={`Waitlisted (${waitlistedBookings.length})`}
                    bookings={waitlistedBookings}
                    variant="waitlisted"
                    onRemove={setBookingToRemove}
                    isRemoving={isRemoving}
                  />
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!bookingToRemove} onOpenChange={(open) => !open && setBookingToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Participant?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{bookingToRemove ? bookingToRemove.user.name || bookingToRemove.user.email : ""}</strong> from
              this session?
              {bookingToRemove?.status === "CONFIRMED" && " Their quota will be restored."}
              {bookingToRemove?.status === "WAITLISTED" &&
                " If there's space, the next waitlisted member will be automatically confirmed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={isRemoving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface BookingSectionProps {
  title: string;
  bookings: NonNullable<Session["bookings"]>;
  variant: "confirmed" | "waitlisted";
  onRemove: (booking: NonNullable<Session["bookings"]>[number]) => void;
  isRemoving: boolean;
}

function BookingSection({ title, bookings, variant, onRemove, isRemoving }: BookingSectionProps) {
  const isWaitlisted = variant === "waitlisted";

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{title}</h4>
      <ScrollArea className="max-h-[300px]">
        <div className="space-y-2">
          {bookings.map((booking, index) => (
            <div
              key={booking.id}
              className={
                isWaitlisted
                  ? "flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3 transition-colors hover:bg-amber-50"
                  : "border-muted hover:bg-muted/30 flex items-center justify-between rounded-lg border p-3 transition-colors"
              }
            >
              <div className="flex flex-1 items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    className={isWaitlisted ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"}
                  >
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{booking.user.name || "No Name"}</p>
                    {isWaitlisted && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        #{index + 1} in queue
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground truncate text-xs">{booking.user.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(booking)}
                disabled={isRemoving}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 flex-shrink-0 p-0"
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
